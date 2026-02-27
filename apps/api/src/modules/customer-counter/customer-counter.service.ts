import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
    RecordVisitDto,
    UpdateVisitDto,
    CounterFiltersDto,
    DateRangePreset,
    VisitSource,
} from './dto';
import {
    format,
    parseISO,
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    subDays,
    subWeeks,
    subMonths,
    differenceInMinutes,
    getHours,
    setHours,
    setMinutes,
    isToday,
    eachDayOfInterval,
} from 'date-fns';

// Types
export interface LiveCount {
    current: number;
    todayTotal: number;
    walkIns: number;
    reservations: number;
    lastUpdated: string;
}

export interface DailyStats {
    date: string;
    formattedDate: string;
    total: number;
    walkIns: number;
    reservations: number;
    onlineOrders: number;
    avgPartySize: number;
    peakHour: number | null;
    peakCount: number | null;
    ordersPlaced: number;
    conversionRate: number;
    totalRevenue: number;
}

export interface HourlyBreakdown {
    hour: number;
    label: string;
    count: number;
    percentage: number;
}

export interface TrendData {
    period: string;
    current: number;
    previous: number;
    change: number;
    changePercent: number;
    trend: 'up' | 'down' | 'stable';
}

@Injectable()
export class CustomerCounterService {
    private readonly logger = new Logger(CustomerCounterService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ============================================
    // RECORD NEW VISIT (INCREMENT)
    // ============================================

    async recordVisit(dto: RecordVisitDto, restaurantId: string, userId?: string): Promise<any> {
        const now = new Date();
        let visitDate: Date;
        let visitTime: Date;

        if (dto.date) {
            visitDate = startOfDay(parseISO(dto.date));
            if (dto.time) {
                const [hour, minute] = dto.time.split(':').map(Number);
                visitTime = setMinutes(setHours(visitDate, hour), minute);
            } else {
                visitTime = setMinutes(setHours(visitDate, now.getHours()), now.getMinutes());
            }
        } else {
            visitDate = startOfDay(now);
            visitTime = now;
        }

        const visit = await this.prisma.customerVisit.create({
            data: {
                visitDate,
                visitTime,
                partySize: dto.partySize,
                source: dto.source || VisitSource.WALK_IN,
                notes: dto.notes,
                restaurantId,
                createdBy: userId,
            },
        });

        await this.updateHourlyCount(restaurantId, visitDate, getHours(visitTime), dto.partySize);
        await this.updateDailyFootfall(restaurantId, visitDate);

        const liveCount = await this.getLiveCount(restaurantId);

        this.logger.log(`Recorded visit: ${dto.partySize} guests (${dto.source}) at ${format(visitTime, 'HH:mm')}`);

        return { visit, liveCount };
    }

    // ============================================
    // QUICK INCREMENT
    // ============================================

    async quickIncrement(restaurantId: string, count: number = 1): Promise<LiveCount> {
        return (await this.recordVisit({ partySize: count }, restaurantId)).liveCount;
    }

    // ============================================
    // DECREMENT (Correction)
    // ============================================

    async decrementToday(restaurantId: string, count: number = 1): Promise<LiveCount> {
        const today = startOfDay(new Date());

        const recentVisits = await this.prisma.customerVisit.findMany({
            where: { restaurantId, visitDate: today },
            orderBy: { visitTime: 'desc' },
            take: count,
        });

        if (recentVisits.length === 0) {
            throw new BadRequestException('No visits to remove for today');
        }

        await this.prisma.customerVisit.deleteMany({
            where: { id: { in: recentVisits.map((v) => v.id) } },
        });

        await this.updateDailyFootfall(restaurantId, today);
        return this.getLiveCount(restaurantId);
    }

    // ============================================
    // GET LIVE COUNT
    // ============================================

    async getLiveCount(restaurantId: string): Promise<LiveCount> {
        const today = startOfDay(new Date());

        const stats = await this.prisma.customerVisit.groupBy({
            by: ['source'],
            where: { restaurantId, visitDate: today },
            _count: { id: true },
            _sum: { partySize: true },
        });

        let todayTotal = 0;
        let walkIns = 0;
        let reservations = 0;

        stats.forEach((s) => {
            const count = s._sum.partySize || s._count.id;
            todayTotal += count;
            if (s.source === 'walk-in') walkIns = count;
            if (s.source === 'reservation') reservations = count;
        });

        const activeCount = await this.prisma.customerVisit.aggregate({
            where: {
                restaurantId,
                visitDate: today,
                exitTime: null,
                visitTime: { gte: subDays(new Date(), 0.125) },
            },
            _sum: { partySize: true },
        });

        return {
            current: activeCount._sum.partySize || 0,
            todayTotal,
            walkIns,
            reservations,
            lastUpdated: new Date().toISOString(),
        };
    }

    // ============================================
    // GET DASHBOARD
    // ============================================

    async getDashboard(restaurantId: string) {
        const [live, today, hourlyBreakdown, peakAnalysis, trends, recentVisits] = await Promise.all([
            this.getLiveCount(restaurantId),
            this.getDailyStats(restaurantId, format(new Date(), 'yyyy-MM-dd')),
            this.getHourlyBreakdown(restaurantId, format(new Date(), 'yyyy-MM-dd')),
            this.getPeakAnalysis(restaurantId),
            this.getTrends(restaurantId),
            this.getRecentVisits(restaurantId, 10),
        ]);

        return { live, today, hourlyBreakdown, peakAnalysis, trends, recentVisits };
    }

    // ============================================
    // GET DAILY STATS
    // ============================================

    async getDailyStats(restaurantId: string, date: string): Promise<DailyStats> {
        const targetDate = startOfDay(parseISO(date));

        let daily = await this.prisma.dailyFootfall.findUnique({
            where: { restaurantId_date: { restaurantId, date: targetDate } },
        });

        if (!daily) {
            await this.updateDailyFootfall(restaurantId, targetDate);
            daily = await this.prisma.dailyFootfall.findUnique({
                where: { restaurantId_date: { restaurantId, date: targetDate } },
            });
        }

        const avgPartySize = daily && daily.totalVisitors > 0
            ? daily.totalPartySize / daily.totalVisitors
            : 0;

        const conversionRate = daily && daily.totalVisitors > 0
            ? (daily.ordersPlaced / daily.totalVisitors) * 100
            : 0;

        return {
            date,
            formattedDate: format(targetDate, 'EEEE, MMMM d, yyyy'),
            total: daily?.totalPartySize || 0,
            walkIns: daily?.walkIns || 0,
            reservations: daily?.reservations || 0,
            onlineOrders: daily?.onlineOrders || 0,
            avgPartySize: Math.round(avgPartySize * 10) / 10,
            peakHour: daily?.peakHour || null,
            peakCount: daily?.peakCount || null,
            ordersPlaced: daily?.ordersPlaced || 0,
            conversionRate: Math.round(conversionRate * 10) / 10,
            totalRevenue: Number(daily?.totalRevenue) || 0,
        };
    }

    // ============================================
    // GET HOURLY BREAKDOWN
    // ============================================

    async getHourlyBreakdown(restaurantId: string, date: string): Promise<HourlyBreakdown[]> {
        const targetDate = startOfDay(parseISO(date));

        const hourlyData = await this.prisma.hourlyFootfall.findMany({
            where: { restaurantId, date: targetDate },
            orderBy: { hour: 'asc' },
        });

        const totalCount = hourlyData.reduce((sum, h) => sum + h.partyTotal, 0);

        const breakdown: HourlyBreakdown[] = [];
        for (let hour = 0; hour < 24; hour++) {
            const data = hourlyData.find((h) => h.hour === hour);
            const count = data?.partyTotal || 0;

            breakdown.push({
                hour,
                label: format(setHours(new Date(), hour), 'ha'),
                count,
                percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
            });
        }

        return breakdown;
    }

    // ============================================
    // GET PEAK ANALYSIS
    // ============================================

    async getPeakAnalysis(restaurantId: string) {
        const last30Days = subDays(new Date(), 30);

        const hourlyAverages = await this.prisma.hourlyFootfall.groupBy({
            by: ['hour'],
            where: { restaurantId, date: { gte: startOfDay(last30Days) } },
            _avg: { partyTotal: true },
        });

        let peakHour = 12, peakCount = 0, quietHour = 0, quietCount = Infinity;
        let totalCount = 0, activeHours = 0;

        hourlyAverages.forEach((h) => {
            const avg = h._avg.partyTotal || 0;
            totalCount += avg;
            if (avg > 0) {
                activeHours++;
                if (avg > peakCount) { peakCount = avg; peakHour = h.hour; }
                if (avg < quietCount) { quietCount = avg; quietHour = h.hour; }
            }
        });

        const dailyTotals = await this.prisma.dailyFootfall.findMany({
            where: { restaurantId, date: { gte: startOfDay(last30Days) } },
            orderBy: { totalPartySize: 'desc' },
            take: 1,
        });

        return {
            peakHour,
            peakHourLabel: format(setHours(new Date(), peakHour), 'ha'),
            peakCount: Math.round(peakCount),
            quietHour,
            quietHourLabel: format(setHours(new Date(), quietHour), 'ha'),
            quietCount: quietCount === Infinity ? 0 : Math.round(quietCount),
            averagePerHour: activeHours > 0 ? Math.round(totalCount / activeHours) : 0,
            busiestDay: dailyTotals[0] ? format(new Date(dailyTotals[0].date), 'EEEE, MMM d') : 'N/A',
            busiestDayCount: dailyTotals[0]?.totalPartySize || 0,
        };
    }

    // ============================================
    // GET TRENDS
    // ============================================

    async getTrends(restaurantId: string): Promise<{ daily: TrendData; weekly: TrendData; monthly: TrendData }> {
        const today = startOfDay(new Date());

        const [todayCount, yesterdayCount] = await Promise.all([
            this.prisma.customerVisit.aggregate({ where: { restaurantId, visitDate: today }, _sum: { partySize: true } }),
            this.prisma.customerVisit.aggregate({ where: { restaurantId, visitDate: subDays(today, 1) }, _sum: { partySize: true } }),
        ]);

        const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
        const [thisWeekCount, lastWeekCount] = await Promise.all([
            this.prisma.customerVisit.aggregate({ where: { restaurantId, visitDate: { gte: thisWeekStart, lte: today } }, _sum: { partySize: true } }),
            this.prisma.customerVisit.aggregate({ where: { restaurantId, visitDate: { gte: subWeeks(thisWeekStart, 1), lt: thisWeekStart } }, _sum: { partySize: true } }),
        ]);

        const thisMonthStart = startOfMonth(today);
        const lastMonthStart = startOfMonth(subMonths(today, 1));
        const [thisMonthCount, lastMonthCount] = await Promise.all([
            this.prisma.customerVisit.aggregate({ where: { restaurantId, visitDate: { gte: thisMonthStart, lte: today } }, _sum: { partySize: true } }),
            this.prisma.customerVisit.aggregate({ where: { restaurantId, visitDate: { gte: lastMonthStart, lte: endOfMonth(subMonths(today, 1)) } }, _sum: { partySize: true } }),
        ]);

        const calculateTrend = (current: number, previous: number, period: string): TrendData => {
            const change = current - previous;
            const changePercent = previous > 0 ? Math.round((change / previous) * 100) : current > 0 ? 100 : 0;
            return { period, current, previous, change, changePercent, trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable' };
        };

        return {
            daily: calculateTrend(todayCount._sum.partySize || 0, yesterdayCount._sum.partySize || 0, 'Today vs Yesterday'),
            weekly: calculateTrend(thisWeekCount._sum.partySize || 0, lastWeekCount._sum.partySize || 0, 'This Week vs Last Week'),
            monthly: calculateTrend(thisMonthCount._sum.partySize || 0, lastMonthCount._sum.partySize || 0, 'This Month vs Last Month'),
        };
    }

    // ============================================
    // GET HISTORY
    // ============================================

    async getHistory(restaurantId: string, filters: CounterFiltersDto) {
        const { dateFrom, dateTo } = this.getDateRange(filters);

        const data = await this.prisma.dailyFootfall.findMany({
            where: { restaurantId, date: { gte: dateFrom, lte: dateTo } },
            orderBy: { date: 'desc' },
            skip: ((filters.page || 1) - 1) * (filters.limit || 50),
            take: filters.limit || 50,
        });

        const total = await this.prisma.dailyFootfall.count({
            where: { restaurantId, date: { gte: dateFrom, lte: dateTo } },
        });

        const periodStats = await this.prisma.dailyFootfall.aggregate({
            where: { restaurantId, date: { gte: dateFrom, lte: dateTo } },
            _sum: { totalPartySize: true, walkIns: true, reservations: true, ordersPlaced: true, totalRevenue: true },
            _avg: { totalPartySize: true },
        });

        return {
            data: data.map((d) => ({
                ...d,
                formattedDate: format(new Date(d.date), 'EEE, MMM d'),
            })),
            summary: {
                totalVisitors: periodStats._sum.totalPartySize || 0,
                totalWalkIns: periodStats._sum.walkIns || 0,
                totalReservations: periodStats._sum.reservations || 0,
                averageDaily: Math.round(periodStats._avg.totalPartySize || 0),
            },
            meta: {
                total,
                page: filters.page || 1,
                limit: filters.limit || 50,
                totalPages: Math.ceil(total / (filters.limit || 50)),
            },
        };
    }

    // ============================================
    // GET RECENT VISITS
    // ============================================

    async getRecentVisits(restaurantId: string, limit: number = 20) {
        const visits = await this.prisma.customerVisit.findMany({
            where: { restaurantId },
            orderBy: { visitTime: 'desc' },
            take: limit,
        });

        return visits.map((v) => ({
            ...v,
            formattedTime: format(new Date(v.visitTime), 'h:mm a'),
            formattedDate: isToday(new Date(v.visitDate)) ? 'Today' : format(new Date(v.visitDate), 'MMM d'),
            timeAgo: this.getTimeAgo(new Date(v.visitTime)),
        }));
    }

    // ============================================
    // UPDATE VISIT
    // ============================================

    async updateVisit(id: string, dto: UpdateVisitDto, restaurantId: string): Promise<any> {
        const visit = await this.prisma.customerVisit.findFirst({ where: { id, restaurantId } });
        if (!visit) throw new NotFoundException('Visit not found');

        const updateData: any = { ...dto };
        if (dto.exitTime) {
            updateData.exitTime = parseISO(dto.exitTime);
            updateData.duration = differenceInMinutes(updateData.exitTime, new Date(visit.visitTime));
        }

        const updated = await this.prisma.customerVisit.update({ where: { id }, data: updateData });
        if (dto.hasOrdered) await this.updateDailyFootfall(restaurantId, new Date(visit.visitDate));
        return updated;
    }

    // ============================================
    // PRIVATE HELPERS
    // ============================================

    private async updateHourlyCount(restaurantId: string, date: Date, hour: number, partySize: number): Promise<void> {
        await this.prisma.hourlyFootfall.upsert({
            where: { restaurantId_date_hour: { restaurantId, date, hour } },
            update: { count: { increment: 1 }, partyTotal: { increment: partySize } },
            create: { restaurantId, date, hour, count: 1, partyTotal: partySize },
        });
    }

    private async updateDailyFootfall(restaurantId: string, date: Date): Promise<void> {
        const stats = await this.prisma.customerVisit.groupBy({
            by: ['source'],
            where: { restaurantId, visitDate: date },
            _count: { id: true },
            _sum: { partySize: true, orderAmount: true },
        });

        let totalVisitors = 0, totalPartySize = 0, walkIns = 0, reservations = 0, onlineOrders = 0, totalRevenue = 0;

        stats.forEach((s) => {
            totalVisitors += s._count.id;
            totalPartySize += s._sum.partySize || 0;
            totalRevenue += Number(s._sum.orderAmount) || 0;
            if (s.source === 'walk-in') walkIns = s._sum.partySize || 0;
            if (s.source === 'reservation') reservations = s._sum.partySize || 0;
            if (s.source === 'online-order') onlineOrders = s._sum.partySize || 0;
        });

        const ordersPlaced = await this.prisma.customerVisit.count({ where: { restaurantId, visitDate: date, hasOrdered: true } });

        const hourlyData = await this.prisma.hourlyFootfall.findMany({
            where: { restaurantId, date },
            orderBy: { partyTotal: 'desc' },
            take: 1,
        });

        const hourlyBreakdown = Array(24).fill(0);
        const allHourly = await this.prisma.hourlyFootfall.findMany({ where: { restaurantId, date } });
        allHourly.forEach((h) => { hourlyBreakdown[h.hour] = h.partyTotal; });

        await this.prisma.dailyFootfall.upsert({
            where: { restaurantId_date: { restaurantId, date } },
            update: { totalVisitors, totalPartySize, walkIns, reservations, onlineOrders, ordersPlaced, totalRevenue, peakHour: hourlyData[0]?.hour ?? null, peakCount: hourlyData[0]?.partyTotal ?? null, hourlyBreakdown },
            create: { restaurantId, date, totalVisitors, totalPartySize, walkIns, reservations, onlineOrders, ordersPlaced, totalRevenue, peakHour: hourlyData[0]?.hour ?? null, peakCount: hourlyData[0]?.partyTotal ?? null, hourlyBreakdown },
        });
    }

    private getDateRange(filters: CounterFiltersDto): { dateFrom: Date; dateTo: Date } {
        const today = startOfDay(new Date());

        if (filters.preset === DateRangePreset.CUSTOM && filters.dateFrom && filters.dateTo) {
            return { dateFrom: startOfDay(parseISO(filters.dateFrom)), dateTo: endOfDay(parseISO(filters.dateTo)) };
        }

        switch (filters.preset) {
            case DateRangePreset.TODAY: return { dateFrom: today, dateTo: endOfDay(today) };
            case DateRangePreset.YESTERDAY: return { dateFrom: subDays(today, 1), dateTo: endOfDay(subDays(today, 1)) };
            case DateRangePreset.THIS_WEEK: return { dateFrom: startOfWeek(today, { weekStartsOn: 1 }), dateTo: endOfDay(today) };
            case DateRangePreset.LAST_WEEK: const lw = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }); return { dateFrom: lw, dateTo: endOfWeek(lw, { weekStartsOn: 1 }) };
            case DateRangePreset.THIS_MONTH: return { dateFrom: startOfMonth(today), dateTo: endOfDay(today) };
            case DateRangePreset.LAST_MONTH: return { dateFrom: startOfMonth(subMonths(today, 1)), dateTo: endOfMonth(subMonths(today, 1)) };
            case DateRangePreset.LAST_7_DAYS: return { dateFrom: subDays(today, 6), dateTo: endOfDay(today) };
            case DateRangePreset.LAST_30_DAYS: return { dateFrom: subDays(today, 29), dateTo: endOfDay(today) };
            default: return { dateFrom: today, dateTo: endOfDay(today) };
        }
    }

    private getTimeAgo(date: Date): string {
        const minutes = differenceInMinutes(new Date(), date);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    }
}
