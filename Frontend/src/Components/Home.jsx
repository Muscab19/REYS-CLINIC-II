import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, 
  ChevronRight, 
  Heart, 
  Stethoscope, 
  Baby, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Facebook, 
  Instagram, 
  Twitter,
  ChevronLeft,
  Star,
  CheckCircle,
  ArrowRight,
  Activity,
  Shield,
  Smile,
  AlertCircle,
  Award,
  Users,
  Microscope,
  Ambulance,
  Syringe,
  Clipboard,
  MessageCircle,
  Plus,
  Minus,
  X,
  LogIn,
  UserPlus,
  LogOut
} from 'lucide-react';
import about from '../assets/about.png';
import parent01 from "../assets/parent01.png";
import parent02 from "../assets/parent02.png";
import parent03 from "../assets/parent03.png";
import hero from "../assets/hero.png";
import logo from "../assets/logo.png";
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userName, setUserName] = useState('');

  // Service details for modals
  const serviceDetails = {
    "Pediatric Care": {
      fullDescription: "Our comprehensive pediatric care covers everything from routine check-ups to treatment of acute and chronic illnesses. We monitor growth and development, provide preventive care, and offer guidance on nutrition, safety, and overall wellness. Our pediatricians are trained to handle everything from common childhood illnesses to more complex medical conditions.",
      benefits: [
        "Regular health check-ups and growth monitoring",
        "Treatment of acute illnesses (fever, infections, colds)",
        "Management of chronic conditions (asthma, allergies, diabetes)",
        "Developmental and behavioral assessments",
        "Newborn and infant care"
      ],
      duration: "30-45 minutes",
      price: "$50 - $150"
    },
    "Vaccinations": {
      fullDescription: "We follow the recommended childhood immunization schedule to protect your child from preventable diseases. Our vaccination program includes all routine vaccines including MMR, DTaP, Polio, Hepatitis B, Chickenpox, and HPV. We maintain proper cold chain storage and administer vaccines by trained professionals in a child-friendly environment.",
      benefits: [
        "Complete immunization records maintained",
        "Vaccine reminder system",
        "Travel vaccinations available",
        "Catch-up vaccination schedules",
        "School-required immunizations"
      ],
      duration: "15-20 minutes",
      price: "$20 - $200 per vaccine"
    },
    "Developmental Screening": {
      fullDescription: "Early detection of developmental delays is crucial for intervention. We use standardized screening tools to assess your child's development in areas including communication, motor skills, problem-solving, and social-emotional development. Regular screenings help identify potential issues early when intervention is most effective.",
      benefits: [
        "Age-appropriate developmental assessments",
        "Early intervention referrals if needed",
        "Autism screening (M-CHAT)",
        "School readiness evaluations",
        "Behavioral assessments"
      ],
      duration: "45-60 minutes",
      price: "$75 - $120"
    },
    "Telemedicine": {
      fullDescription: "Virtual consultations make healthcare accessible from the comfort of your home. Our telemedicine platform allows for secure video visits for follow-ups, minor illnesses, medication reviews, and consultations. Perfect for busy families or when your child has mild symptoms that don't require an in-person visit.",
      benefits: [
        "Secure HIPAA-compliant video platform",
        "Prescriptions sent to your pharmacy",
        "Follow-up visits from anywhere",
        "Reduced wait times",
        "Ideal for minor concerns and medication checks"
      ],
      duration: "15-20 minutes",
      price: "$40 - $80"
    },
    "Nutrition Counseling": {
      fullDescription: "Proper nutrition is essential for growing children. Our registered dietitians provide personalized nutrition plans for picky eaters, food allergies, weight management, and special dietary needs. We work with families to develop healthy eating habits that last a lifetime.",
      benefits: [
        "Personalized meal plans",
        "Picky eating strategies",
        "Food allergy management",
        "Weight management guidance",
        "Sports nutrition for young athletes"
      ],
      duration: "45 minutes",
      price: "$60 - $100"
    },
    "Cardiology Checkup": {
      fullDescription: "Specialized heart care for young patients. Our pediatric cardiologists evaluate and treat heart conditions including murmurs, chest pain, palpitations, and congenital heart defects. We use child-friendly diagnostic tools including echocardiograms and EKGs in a comfortable setting.",
      benefits: [
        "Comprehensive cardiac evaluations",
        "Echocardiograms and EKGs",
        "Heart murmur assessment",
        "Congenital heart disease management",
        "Sports participation clearance"
      ],
      duration: "60 minutes",
      price: "$100 - $250"
    }
  };

  const testimonials = [
    {
      name: "Baarliin Ali",
      child: "Mother of 2-year-old",
      text: "REYS CLINIC has been a blessing for our family. Dr. Ikraan is incredibly patient and knowledgeable. The staff always makes us feel welcome and cared for.",
      rating: 5,
      image: parent01
    },
    {
      name: "Geedi Farah",
      child: "Father of 5-year-old",
      text: "The best pediatric care we've ever experienced. The clinic is clean, modern, and the doctors truly listen to our concerns. Highly recommended!",
      rating: 5,
      image: parent02
    },
    {
      name: "Maryan Ahmed",
      child: "Parent of twins (3 years old)",
      text: "Exceptional care for our twins. The clinic is well-equipped and the telemedicine option has been a lifesaver during busy days.",
      rating: 5,
      image: parent03
    }
  ];

  const services = [
    {
      icon: <Baby className="w-8 h-8" />,
      title: "Pediatric Care",
      description: "Comprehensive medical care for children from birth to adolescence.",
      color: "bg-red-50"
    },
    {
      icon: <Syringe className="w-8 h-8" />,
      title: "Vaccinations",
      description: "Complete immunization schedules following international standards.",
      color: "bg-pink-50"
    },
    {
      icon: <Activity className="w-8 h-8" />,
      title: "Developmental Screening",
      description: "Regular check-ups to monitor growth and development milestones.",
      color: "bg-red-50"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Telemedicine",
      description: "Virtual consultations for follow-ups and minor concerns.",
      color: "bg-pink-50"
    },
    {
      icon: <Clipboard className="w-8 h-8" />,
      title: "Nutrition Counseling",
      description: "Expert guidance on healthy eating habits for children.",
      color: "bg-red-50"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Cardiology Checkup",
      description: "Specialized heart health assessments for young patients.",
      color: "bg-pink-50"
    }
  ];

  const features = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Flexible Hours",
      description: "Evening and weekend appointments available"
    },
    {
      icon: <AlertCircle className="w-6 h-6" />,
      title: "Emergency Care",
      description: "Immediate care for urgent pediatric needs"
    },
    {
      icon: <Smile className="w-6 h-6" />,
      title: "Child-Friendly Environment",
      description: "Designed to make children feel comfortable"
    }
  ];

  const whyChooseUs = [
    {
      icon: <Award className="w-10 h-10" />,
      title: "Experienced Pediatricians",
      description: "Over 50+ years of combined experience in child healthcare"
    },
    {
      icon: <Microscope className="w-10 h-10" />,
      title: "Modern Equipment",
      description: "State-of-the-art diagnostic tools and treatment facilities"
    },
    {
      icon: <Users className="w-10 h-10" />,
      title: "Patient-Centered Care",
      description: "Personalized treatment plans for every child's unique needs"
    },
    {
      icon: <Ambulance className="w-10 h-10" />,
      title: "24/7 Emergency Support",
      description: "Round-the-clock emergency care and ambulance service"
    }
  ];

  const doctors = [
    {
      name: "Dr. Ikraan Mohamed",
      specialty: "Pediatric Specialist",
      experience: "12+ years",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop"
    },
    {
      name: "Dr. Ahmed Hassan",
      specialty: "Neonatologist",
      experience: "15+ years",
      image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop"
    },
    {
      name: "Dr. Fartun Ali",
      specialty: "Child Psychologist",
      experience: "10+ years",
      image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300&h=300&fit=crop"
    },
    {
      name: "Dr. Omar Farah",
      specialty: "Pediatric Surgeon",
      experience: "18+ years",
      image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&h=300&fit=crop"
    }
  ];

  const faqs = [
    {
      question: "What age range do you treat?",
      answer: "We treat children from birth through adolescence (0-18 years). Our pediatric care covers all developmental stages, from newborns to teenagers."
    },
    {
      question: "How do I schedule an appointment?",
      answer: "You can schedule an appointment by calling our office, using our online booking system, or visiting us in person. Same-day appointments are available for urgent concerns."
    },
    {
      question: "Do you offer telemedicine consultations?",
      answer: "Yes, we offer virtual consultations for follow-up visits, minor illnesses, and medication reviews. This service is convenient for busy families."
    },
    {
      question: "What should I bring to my first visit?",
      answer: "Please bring your child's medical records, immunization history, insurance card, and a list of any medications your child is currently taking."
    }
  ];

  const nextTestimonial = () => {
    setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleLearnMore = (serviceTitle) => {
    setSelectedService(serviceDetails[serviceTitle]);
    setIsModalOpen(true);
  };

  const handleCall = () => {
    window.location.href = 'tel:+252611477201';
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    const interval = setInterval(() => {
      nextTestimonial();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      setUserName(user.name);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src={logo} 
                alt="REYS CLINIC Logo" 
                className="h-16 w-auto object-contain"
              />
            </Link>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-800 hover:text-[#D01A2B] transition-colors">Home</a>
              <a href="#services" className="text-gray-800 hover:text-[#D01A2B] transition-colors">Services</a>
              <a href="#doctors" className="text-gray-800 hover:text-[#D01A2B] transition-colors">Doctors</a>
              <a href="#about" className="text-gray-800 hover:text-[#D01A2B] transition-colors">About</a>
              <a href="#testimonials" className="text-gray-800 hover:text-[#D01A2B] transition-colors">Testimonials</a>
              <a href="#faq" className="text-gray-800 hover:text-[#D01A2B] transition-colors">FAQ</a>
              <a href="#contact" className="text-gray-800 hover:text-[#D01A2B] transition-colors">Contact</a>
              
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-800">👋 Hi, {userName}</span>
                  <button onClick={handleLogout} className="flex items-center space-x-1 text-red-600 hover:text-red-700">
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link to="/signin" className="flex items-center space-x-1 text-gray-700 hover:text-[#D01A2B] transition-colors">
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </Link>
                  <Link to="/signup" className="bg-[#D01A2B] text-white px-4 py-2 rounded-full hover:bg-red-700 transition-colors flex items-center space-x-1">
                    <UserPlus className="w-4 h-4" />
                    <span>Sign Up</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-2 space-y-3">
              <a href="#home" className="block text-gray-800 hover:text-[#D01A2B]" onClick={() => setIsMenuOpen(false)}>Home</a>
              <a href="#services" className="block text-gray-800 hover:text-[#D01A2B]" onClick={() => setIsMenuOpen(false)}>Services</a>
              <a href="#doctors" className="block text-gray-800 hover:text-[#D01A2B]" onClick={() => setIsMenuOpen(false)}>Doctors</a>
              <a href="#about" className="block text-gray-800 hover:text-[#D01A2B]" onClick={() => setIsMenuOpen(false)}>About</a>
              <a href="#testimonials" className="block text-gray-800 hover:text-[#D01A2B]" onClick={() => setIsMenuOpen(false)}>Testimonials</a>
              <a href="#faq" className="block text-gray-800 hover:text-[#D01A2B]" onClick={() => setIsMenuOpen(false)}>FAQ</a>
              <a href="#contact" className="block text-gray-800 hover:text-[#D01A2B]" onClick={() => setIsMenuOpen(false)}>Contact</a>
              
              {isAuthenticated ? (
                <div className="flex items-center justify-between">
                  <span className="text-gray-800">Hi, {userName}</span>
                  <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="text-red-600">Logout</button>
                </div>
              ) : (
                <div className="flex space-x-3">
                  <Link to="/signin" className="flex-1 border border-[#D01A2B] text-[#D01A2B] px-4 py-2 rounded-full text-center" onClick={() => setIsMenuOpen(false)}>
                    Sign In
                  </Link>
                  <Link to="/signup" className="flex-1 bg-[#D01A2B] text-white px-4 py-2 rounded-full text-center" onClick={() => setIsMenuOpen(false)}>
                    Sign Up
                  </Link>
                </div>
              )}
              <Link to="/book-appointment" onClick={() => setIsMenuOpen(false)}>
                <button className="bg-[#D01A2B] text-white px-6 py-2 rounded-full w-full">
                  Book Appointment
                </button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Service Detail Modal */}
      {isModalOpen && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900">Service Details</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">{selectedService.fullDescription}</p>
              <h4 className="font-bold text-lg mb-3">Benefits & Features:</h4>
              <ul className="list-disc list-inside space-y-2 mb-6">
                {selectedService.benefits.map((benefit, idx) => (
                  <li key={idx} className="text-gray-600">{benefit}</li>
                ))}
              </ul>
              <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                <Link to="/book-appointment">
                  <button className="bg-[#D01A2B] text-white px-4 py-2 rounded-full hover:bg-red-700 transition-colors">
                    Book Appointment
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section id="home" className="pt-10 bg-gradient-to-r from-red-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-red-100 text-[#D01A2B] px-4 py-2 rounded-full mb-6">
                <Heart className="w-4 h-4" />
                <span className="text-sm font-semibold">Expert Care for Every Child</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Quality Care for Your 
                <span className="text-[#D01A2B]"> Little Ones</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Providing exceptional pediatric care in a warm, child-friendly environment. 
                Your child's health and happiness is our top priority.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/book-appointment">
                  <button className="bg-[#D01A2B] text-white px-8 py-3 rounded-full hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto">
                    <Calendar className="w-5 h-5" />
                    <span>Book Appointment</span>
                  </button>
                </Link>
                <button onClick={handleCall} className="border-2 border-[#D01A2B] text-[#D01A2B] px-8 py-3 rounded-full hover:bg-red-50 transition-colors flex items-center justify-center space-x-2">
                  <Phone className="w-5 h-5" />
                  <span>Emergency: +252 61 1477201</span>
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-12">
                {features.map((feature, idx) => (
                  <div key={idx} className="text-center">
                    <div className="text-[#D01A2B] mb-2 flex justify-center">{feature.icon}</div>
                    <h4 className="font-semibold text-sm">{feature.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-[#D01A2B] to-red-600 rounded-3xl p-4">
                <img 
                  src={hero}
                  alt="Happy child with doctor"
                  className="rounded-2xl shadow-xl w-full h-auto"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">100+ Happy Families</p>
                  <p className="text-sm text-gray-500">Trusted by parents</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#D01A2B]">100+</div>
              <p className="text-gray-600 mt-2">Happy Patients</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#D01A2B]">24/7</div>
              <p className="text-gray-600 mt-2">Emergency Care Available</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#D01A2B]">350+</div>
              <p className="text-gray-600 mt-2">Vaccinations Given</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#D01A2B]">98%</div>
              <p className="text-gray-600 mt-2">Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our <span className="text-[#D01A2B]">Services</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Comprehensive pediatric care tailored to meet your child's unique needs at every stage of development
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, idx) => (
              <div key={idx} className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-center border border-gray-100">
                <div className={`${service.color} w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#D01A2B] group-hover:scale-110 transition-transform duration-300`}>
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <button 
                  onClick={() => handleLearnMore(service.title)}
                  className="text-[#D01A2B] font-semibold flex items-center justify-center space-x-1 group-hover:space-x-2 transition-all"
                >
                  <span>Learn More</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose <span className="text-[#D01A2B]">REYS CLINIC</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We are committed to providing the highest quality healthcare for your children
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUs.map((item, idx) => (
              <div key={idx} className="text-center group">
                <div className="bg-red-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#D01A2B] group-hover:bg-[#D01A2B] group-hover:text-white transition-all duration-300">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src={about} 
                alt="Modern clinic interior" 
                className="rounded-2xl shadow-xl w-full h-auto"
              />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                About <span className="text-[#D01A2B]">REYS CLINIC</span>
              </h2>
              <div className="w-20 h-1 bg-[#D01A2B] mb-6"></div>
              <p className="text-gray-600 mb-4">
                Founded with a vision to provide exceptional healthcare for children, REYS CLINIC has become a trusted name in pediatric care. Our state-of-the-art facility is designed to create a warm, welcoming environment where children feel safe and parents feel confident.
              </p>
              <p className="text-gray-600 mb-6">
                Led by experienced pediatricians, our team is dedicated to preventive care, early intervention, and comprehensive treatment. We're proud to serve our community with compassion, expertise, and the latest medical advancements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What <span className="text-[#D01A2B]">Parents Say</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Hear from families who trust us with their children's health
            </p>
          </div>
          
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
              <div className="flex flex-col items-center text-center">
                <img 
                  src={testimonials[activeTestimonial].image} 
                  alt={testimonials[activeTestimonial].name}
                  className="w-20 h-20 rounded-full object-cover mb-4 border-4 border-[#D01A2B]"
                />
                <div className="flex mb-4">
                  {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-lg italic mb-6">"{testimonials[activeTestimonial].text}"</p>
                <h4 className="font-bold text-gray-900">{testimonials[activeTestimonial].name}</h4>
                <p className="text-sm text-gray-500">{testimonials[activeTestimonial].child}</p>
              </div>
            </div>
            
            <button 
              onClick={prevTestimonial}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-6 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-[#D01A2B]" />
            </button>
            <button 
              onClick={nextTestimonial}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-6 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-[#D01A2B]" />
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked <span className="text-[#D01A2B]">Questions</span>
            </h2>
            <p className="text-gray-600">
              Find answers to common questions about our clinic and services
            </p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  {openFaq === idx ? (
                    <Minus className="w-5 h-5 text-[#D01A2B]" />
                  ) : (
                    <Plus className="w-5 h-5 text-[#D01A2B]" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get In <span className="text-[#D01A2B]">Touch</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Ready to schedule an appointment? Contact us today
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Book an Appointment</h3>
                <p className="text-gray-500 mb-4">Click the button below to schedule an appointment</p>
                <Link to="/book-appointment">
                  <button className="w-full bg-[#D01A2B] text-white py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Book Appointment</span>
                  </button>
                </Link>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-[#D01A2B] mt-1" />
                    <div>
                      <p className="font-semibold">Address</p>
                      <p className="text-gray-600">Al-Baraka, Hodan, Mogadishu, Somalia</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <button onClick={handleCall} className="flex items-start space-x-3 hover:opacity-80">
                      <Phone className="w-5 h-5 text-[#D01A2B] mt-1" />
                      <div>
                        <p className="font-semibold">Phone</p>
                        <p className="text-gray-600">+252 61 1477201</p>
                        <p className="text-sm text-gray-500">Click to call</p>
                      </div>
                    </button>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-[#D01A2B] mt-1" />
                    <div>
                      <p className="font-semibold">Email</p>
                      <p className="text-gray-600">info@reysclinic.com</p>
                      <p className="text-sm text-gray-500">support@reysclinic.com</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-[#D01A2B] mt-1" />
                    <div>
                      <p className="font-semibold">Working Hours</p>
                      <p className="text-gray-600">Sat-Thur: 8:00 AM - 8:00 PM</p>
                      <p className="text-gray-600">Fri: Closed (Emergency only)</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Follow Us</h3>
                <div className="flex space-x-4">
                  <a href="#" className="w-10 h-10 bg-[#D01A2B] rounded-full flex items-center justify-center hover:bg-red-700 transition-colors">
                    <Facebook className="w-5 h-5 text-white" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-[#D01A2B] rounded-full flex items-center justify-center hover:bg-red-700 transition-colors">
                    <Instagram className="w-5 h-5 text-white" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-[#D01A2B] rounded-full flex items-center justify-center hover:bg-red-700 transition-colors">
                    <Twitter className="w-5 h-5 text-white" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-[#D01A2B]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Subscribe to Our Newsletter</h2>
          <p className="text-white/90 mb-8">Get health tips, clinic updates, and special offers directly in your inbox.</p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email address" 
              className="flex-1 px-4 py-3 rounded-lg focus:outline-none"
            />
            <button className="bg-white text-[#D01A2B] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-[#D01A2B] rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">REYS CLINIC</h3>
              </div>
              <p className="text-gray-400 text-sm">Quality care, trusted service for your little ones.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#home" className="hover:text-white transition-colors">Home</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Services</a></li>
                <li><a href="#doctors" className="hover:text-white transition-colors">Doctors</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Our Services</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Pediatric Care</li>
                <li>Vaccinations</li>
                <li>Telemedicine</li>
                <li>Developmental Screening</li>
                <li>Nutrition Counseling</li>
                <li>Cardiology Checkup</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Working Hours</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Sat - Thur: 8:00 AM - 8:00 PM</li>
                <li>Friday: Emergency Only</li>
                <li className="mt-4">24/7 Emergency Support</li>
                <li className="text-[#D01A2B]">+252 61 1477201</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2026 REYS CLINIC. All rights reserved. | Privacy Policy | Terms of Service</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

// Expert Care for Every Child