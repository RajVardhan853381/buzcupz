import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Coffee, ArrowRight, CheckCircle2, BarChart3, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';

export function LandingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app');
    }
  }, [isAuthenticated, navigate]);

  const features = [
    { icon: BarChart3, title: 'Smart Analytics', desc: 'Real-time insights into your cafe\'s performance, sales, and trends.' },
    { icon: Users, title: 'Team Management', desc: 'Effortlessly manage staff schedules, roles, and performance.' },
    { icon: Calendar, title: 'Reservation System', desc: 'Seamlessly handle table bookings and walk-in customers.' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gold-50/30 overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 via-warm-500 to-gold-600 flex items-center justify-center shadow-lg">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-gold-600 to-warm-500 bg-clip-text text-transparent">
              BuzCupz
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/login')} className="hidden sm:flex border-gold-200 text-gray-700 hover:bg-gold-50">
              Log in
            </Button>
            <Button onClick={() => navigate('/register')} className="bg-gradient-to-r from-gold-500 to-warm-500 text-white border-0 shadow-lg shadow-gold-200/50 hover:shadow-gold-300/50">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8">
              Elevate your cafe with <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-500 to-warm-500">
                intelligent management
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              The all-in-one platform designed specifically for modern cafes and coffee shops. Manage orders, inventory, reservations, and staff in one beautiful place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button onClick={() => navigate('/register')} size="lg" className="w-full sm:w-auto text-lg px-8 py-4 bg-gradient-to-r from-gold-500 to-warm-500 text-white rounded-2xl shadow-xl shadow-gold-200/50 hover:scale-105 transition-all">
                Start your free trial <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button onClick={() => navigate('/login')} variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-4 rounded-2xl border-2 border-gray-200 hover:border-gold-300 transition-all">
                See live demo
              </Button>
            </div>
            
            <div className="mt-12 flex items-center justify-center gap-6 text-sm text-gray-500 font-medium">
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> No credit card required</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> 14-day free trial</span>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-24 grid md:grid-cols-3 gap-8 text-left"
          >
            {features.map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 hover:-translate-y-2 transition-transform duration-300">
                <div className="w-12 h-12 rounded-xl bg-gold-50 flex items-center justify-center mb-6">
                  <f.icon className="w-6 h-6 text-gold-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
