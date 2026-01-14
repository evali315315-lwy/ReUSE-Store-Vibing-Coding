import { Recycle, ShoppingBag, Clock, MapPin, Mail, Heart } from 'lucide-react';
import squirrelLogo from '../../assets/squirrel.svg';

function AboutContent() {
  return (
    <div className="space-y-12">
      {/* Hero Section with Squirrel */}
      <section className="text-center py-12 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-48 bg-gradient-to-b from-eco-primary-100 via-eco-teal-light/20 to-transparent rounded-full blur-3xl -z-10"></div>

        <div className="flex justify-center items-center gap-6 mb-6">
          <img src={squirrelLogo} alt="Black Squirrel Mascot" className="w-24 h-24 animate-bounce" style={{ animationDuration: '3s' }} />
          <div className="inline-block p-4 bg-gradient-to-br from-eco-primary-200 to-eco-teal-light rounded-full shadow-lg">
            <Recycle className="w-16 h-16 text-eco-primary-700" />
          </div>
        </div>

        <h1 className="text-5xl font-bold bg-gradient-to-r from-eco-primary-700 via-eco-teal-dark to-eco-primary-800 bg-clip-text text-transparent mb-4 font-display">
          Welcome to the ReUSE Store
        </h1>
        <p className="text-xl text-gray-700 max-w-3xl mx-auto font-medium">
          Haverford College's sustainable solution for reducing waste and promoting reuse on campus
        </p>
        <p className="text-lg text-eco-primary-600 mt-2 font-semibold">
          Home of the Black Squirrel Initiative
        </p>
      </section>

      {/* What is ReUSE Store */}
      <section className="card max-w-4xl mx-auto bg-gradient-to-br from-white via-eco-primary-50 to-eco-teal-light/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-eco-primary-200 to-eco-teal-light rounded-lg shadow-md">
            <Heart className="w-8 h-8 text-eco-primary-700" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-eco-primary-800 to-eco-teal-dark bg-clip-text text-transparent mb-4">What is the ReUSE Store?</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The ReUSE Store is Haverford College's sustainability initiative dedicated to reducing waste
              and promoting a circular economy on campus. We collect gently used items from students, faculty,
              and staff, and make them available for free to the Haverford community.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By participating in the ReUSE Store, you're helping to divert usable items from landfills,
              reduce carbon emissions, and support fellow students who need essential items.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-eco-primary-700 to-eco-teal-dark bg-clip-text text-transparent mb-8 text-center">How It Works</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Donating */}
          <div className="card bg-gradient-to-br from-eco-lime-light/30 to-eco-primary-100 border-2 border-eco-primary-300 hover:shadow-xl transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-eco-primary-300 to-eco-lime-light rounded-lg shadow-md">
                <Recycle className="w-6 h-6 text-eco-primary-700" />
              </div>
              <h3 className="text-2xl font-bold text-eco-primary-800">Donating Items</h3>
            </div>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-eco-primary-500 font-bold mt-1">•</span>
                <span>Bring clean, gently used items to the ReUSE Store during open hours</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-eco-primary-500 font-bold mt-1">•</span>
                <span>Accepted items include: hangers, fans, kitchen goods, lamps, minifridges and small appliances, new toiletries, office goods, and much more!</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-eco-primary-500 font-bold mt-1">•</span>
                <span>Our student workers will log your donation and ensure it finds a new home</span>
              </li>
            </ul>
          </div>

          {/* Shopping */}
          <div className="card bg-gradient-to-br from-eco-teal-light/30 to-eco-primary-100 border-2 border-eco-teal-light hover:shadow-xl transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-eco-teal-light to-eco-primary-300 rounded-lg shadow-md">
                <ShoppingBag className="w-6 h-6 text-eco-teal-dark" />
              </div>
              <h3 className="text-2xl font-bold text-eco-teal-dark">Shopping/Taking Items</h3>
            </div>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-eco-primary-500 font-bold mt-1">•</span>
                <span>All items are completely free for Haverford students, faculty, and staff</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-eco-primary-500 font-bold mt-1">•</span>
                <span>Visit during our open hours and browse available items</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-eco-primary-500 font-bold mt-1">•</span>
                <span>Take what you need - no purchase or checkout required</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-eco-primary-500 font-bold mt-1">•</span>
                <span>Please only take items you will actually use to ensure availability for others</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* What We Accept / Don't Accept */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-eco-primary-700 to-eco-teal-dark bg-clip-text text-transparent mb-8 text-center">Accepted & Non-Accepted Items</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* What We Accept */}
          <div className="card bg-gradient-to-br from-eco-primary-100 to-eco-lime-light/30 border-2 border-eco-primary-400">
            <h3 className="text-2xl font-bold text-eco-primary-800 mb-4 flex items-center gap-2">
              <span className="text-3xl">✅</span> We Accept
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-eco-primary-500 font-bold mt-1">•</span>
                <span>Hangers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-eco-primary-500 font-bold mt-1">•</span>
                <span>Fans</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-eco-primary-500 font-bold mt-1">•</span>
                <span>Kitchen Goods</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-eco-primary-500 font-bold mt-1">•</span>
                <span>Lamps</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-eco-primary-500 font-bold mt-1">•</span>
                <span>Minifridges and Small Appliances</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-eco-primary-500 font-bold mt-1">•</span>
                <span>New Toiletries</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-eco-primary-500 font-bold mt-1">•</span>
                <span>Office Goods</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-eco-primary-500 font-bold mt-1">•</span>
                <span className="font-semibold">So much more!!</span>
              </li>
            </ul>
          </div>

          {/* What We Don't Accept */}
          <div className="card bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200">
            <h3 className="text-2xl font-bold text-red-700 mb-4 flex items-center gap-2">
              <span className="text-3xl">❌</span> We Don't Accept
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold mt-1">•</span>
                <span>Broken items</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold mt-1">•</span>
                <span>Clothing and soft goods (towels, bedding, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold mt-1">•</span>
                <span>Dirty items</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold mt-1">•</span>
                <span>Opened/Used toiletries</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold mt-1">•</span>
                <span>Large furniture</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold mt-1">•</span>
                <span>Mattress pads</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold mt-1">•</span>
                <span>Nonperishable food</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold mt-1">•</span>
                <span>Rugs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold mt-1">•</span>
                <span>Trash</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Hours & Location */}
      <section className="card max-w-4xl mx-auto bg-gradient-to-br from-eco-primary-100 via-eco-teal-light/20 to-eco-lime-light/20 border-2 border-eco-primary-400 shadow-lg">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-eco-primary-700 to-eco-teal-dark bg-clip-text text-transparent mb-6 text-center">Visit Us</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Location */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-eco-primary-300 to-eco-teal-light rounded-lg shadow-md">
                <MapPin className="w-6 h-6 text-eco-primary-800" />
              </div>
              <h3 className="text-xl font-bold text-eco-primary-800">Location</h3>
            </div>
            <p className="text-gray-700">
              <strong>Haverford College</strong><br />
              Comfort Hall, Basement<br />
              370 Lancaster Avenue<br />
              Haverford, PA 19041
            </p>
          </div>

          {/* Hours */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-eco-teal-light to-eco-primary-300 rounded-lg shadow-md">
                <Clock className="w-6 h-6 text-eco-teal-dark" />
              </div>
              <h3 className="text-xl font-bold text-eco-teal-dark">Hours</h3>
            </div>
            <div className="text-gray-700 space-y-1">
              <p><strong>Tuesday:</strong> 3:00 PM - 5:00 PM</p>
              <p><strong>Friday:</strong> 1:00 PM - 3:00 PM</p>
              <p><strong>Saturday:</strong> 9:00 AM - 11:00 AM</p>
              <p className="text-sm text-eco-primary-600 mt-3">
                *Hours may vary during breaks and exam periods
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="card max-w-4xl mx-auto">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-eco-primary-100 rounded-lg">
            <Mail className="w-8 h-8 text-eco-primary-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-eco-primary-800 mb-4">Get in Touch</h2>
            <p className="text-gray-700 mb-4">
              Have questions about donations, need to arrange a large item drop-off, or want to volunteer?
            </p>
            <div className="space-y-2">
              <p className="text-gray-700">
                <strong>Email:</strong>{' '}
                <a href="mailto:reuse@haverford.edu" className="text-eco-primary-600 hover:text-eco-primary-700 underline">
                  reuse@haverford.edu
                </a>
              </p>
              <p className="text-gray-700">
                <strong>Phone:</strong> (610) 896-1000
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Environmental Impact */}
      <section className="card max-w-4xl mx-auto bg-gradient-to-br from-eco-lime-light/30 via-eco-primary-100 to-eco-teal-light/30 border-2 border-eco-lime shadow-lg">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-eco-primary-700 via-eco-lime-dark to-eco-teal-dark bg-clip-text text-transparent mb-4 text-center">Our Environmental Impact</h2>
        <p className="text-gray-700 text-center max-w-2xl mx-auto mb-6">
          Every item reused is an item that doesn't end up in a landfill. Check out our{' '}
          <a href="/statistics" className="text-eco-primary-600 hover:text-eco-primary-700 font-semibold underline">
            Statistics page
          </a>
          {' '}to see the incredible impact our community has made through the ReUSE Store.
        </p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4">
            <p className="text-4xl font-bold text-eco-primary-600 mb-2">♻️</p>
            <p className="text-sm text-gray-600 font-semibold">Reduce Waste</p>
          </div>
          <div className="p-4">
            <p className="text-4xl font-bold text-eco-primary-600 mb-2">🌱</p>
            <p className="text-sm text-gray-600 font-semibold">Lower Carbon Footprint</p>
          </div>
          <div className="p-4">
            <p className="text-4xl font-bold text-eco-primary-600 mb-2">💚</p>
            <p className="text-sm text-gray-600 font-semibold">Support Community</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutContent;
