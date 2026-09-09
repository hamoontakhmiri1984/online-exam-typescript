import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import News from './components/News';
import About from './components/About';
import Pricing from './components/Pricing';
import Footer from './components/Footer';

function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-light text-gray-900 transition-colors dark:bg-surface-dark dark:text-white">
      <Navbar />
      <Hero />
      <Features />
      <News />
      <About />
      <Pricing />
      <Footer />
    </div>
  );
}

export default LandingPage;
