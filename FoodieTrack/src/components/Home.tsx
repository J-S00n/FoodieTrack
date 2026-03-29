// import Header from './Header';
// import Hero from './Hero';
// import Features from './Features';
// import HowItWorks from './HowItWorks';
// import Testimonials from './Testimonials';
// import Footer from './Footer';

// export default function Home() {
//   return (
//     <div className="min-h-screen bg-white">
//       <Header />
//       <Hero />
//       <Features />
//       <HowItWorks />
//       <Testimonials />
//       <Footer />
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { motion } from "framer-motion";
import {
  Menu,
  X,
  Utensils,
  Brain,
  TrendingUp,
  Mic,
  Heart,
  Leaf,
  ArrowRight,
  Star,
  Play,
} from "lucide-react";

//HOME            
export default function Home() {
  const { loginWithRedirect, logout, isAuthenticated } = useAuth0();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // UI                             
  return (
    <div className="min-h-screen bg-[#FAFAF8] overflow-x-hidden">

      {/*HEADER*/}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/90 backdrop-blur border-b border-slate-200" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center">
              <Utensils className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-slate-900">FoodieTrack</span>
          </div>

          <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#testimonials">Testimonials</a>
          </nav>

          <div className="hidden md:block">
            {!isAuthenticated ? (
              <button
                onClick={() => loginWithRedirect()}
                className="px-6 py-2 rounded-full bg-slate-900 text-white"
              >
                Get Started
              </button>
            ) : (
              <button
                onClick={() =>
                  logout({ logoutParams: { returnTo: window.location.origin } })
                }
                className="px-6 py-2 rounded-full border"
              >
                Sign Out
              </button>
            )}
          </div>

          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/*HERO*/}
      <section className="pt-40 pb-28 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-emerald-50 border border-emerald-100">
              <Heart className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">
                AI-Powered Campus Dining
              </span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 leading-tight">
              Eat smarter.
              <br />
              <span className="text-emerald-600">Feel better.</span>
            </h1>

            <p className="mt-6 text-xl text-slate-500 max-w-md">
              Voice-powered recommendations that understand your mood,
              preferences, and goals.
            </p>

            <div className="mt-10 flex gap-4">
              <button
                onClick={() => loginWithRedirect()}
                className="px-8 py-4 rounded-full bg-slate-900 text-white flex items-center gap-2"
              >
                Start for free <ArrowRight className="w-4 h-4" />
              </button>
              <button className="px-8 py-4 rounded-full border flex items-center gap-2">
                <Play className="w-4 h-4" /> Watch demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/*FEATURES*/}
      <section id="features" className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything you need</h2>
            <p className="text-xl text-slate-500">
              Smart features that adapt to you
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Large AI Card */}
            <div className="md:col-span-2 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-10 text-white">
              <Brain className="w-10 h-10 mb-6" />
              <h3 className="text-3xl font-bold mb-3">Voice-Powered AI</h3>
              <p className="text-emerald-100 max-w-md">
                We analyze your voice to detect mood and energy, then tailor
                meal recommendations instantly.
              </p>
            </div>

            <Feature icon={TrendingUp} title="Nutrition Tracking" />
            <Feature icon={Utensils} title="Campus Menus" />
            <Feature icon={Leaf} title="Dietary Preferences" />
            <Feature icon={Heart} title="Health Goals" />

          </div>
        </div>
      </section>

      {/*HOW IT WORKS*/}
      <section id="how-it-works" className="py-28 bg-[#EFEEEA]/60">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-12">How it works</h2>

          <div className="grid md:grid-cols-3 gap-12">
            <Step n="01" title="Create Account" icon={<Star />} />
            <Step n="02" title="Speak Naturally" icon={<Mic />} />
            <Step n="03" title="Get Recommendations" icon={<Heart />} />
          </div>
        </div>
      </section>

      {/*TESTIMONIALS*/}
      <section id="testimonials" className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-center text-4xl font-bold mb-12">
            Loved by students
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {["Sarah", "Marcus", "Emily"].map((name) => (
              <div key={name} className="bg-white p-8 rounded-3xl border">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-600 italic mb-6">
                  “FoodieTrack completely changed how I eat on campus.”
                </p>
                <div className="font-bold">{name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*FOOTER*/}
      <footer className="py-16 border-t text-center text-sm text-slate-400">
        © {new Date().getFullYear()} FoodieTrack. All rights reserved.
      </footer>
    </div>
  );
}

/* HELPER COMPONENTS */                 

function Feature({ icon: Icon, title }: any) {
  return (
    <div className="bg-white p-8 rounded-3xl border shadow-sm">
      <Icon className="w-8 h-8 mb-4 text-emerald-600" />
      <h4 className="font-bold text-lg">{title}</h4>
    </div>
  );
}

function Step({ n, title, icon }: any) {
  return (
    <div>
      <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center mb-6">
        {icon}
      </div>
      <div className="font-bold text-xl mb-2">{title}</div>
      <div className="text-slate-500">Step {n}</div>
    </div>
  );
}
