import { Recycle, ShoppingBag, Clock, MapPin, Mail, Heart } from 'lucide-react';

function AboutContent() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <div className="inline-block p-4 bg-eco-primary-100 rounded-full mb-6">
          <Recycle className="w-16 h-16 text-eco-primary-600" />
        </div>
        <h1 className="text-5xl font-bold text-eco-primary-800 mb-4 font-display">
          Welcome to the ReUSE Store
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Haverford College's sustainable solution for reducing waste and promoting reuse on campus
        </p>
      </section>

      {/* What is ReUSE Store */}
      <section className="card max-w-4xl mx-auto">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-eco-primary-100 rounded-lg">
            <Heart className="w-8 h-8 text-eco-primary-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-eco-primary-800 mb-4">What is the ReUSE Store?</h2>
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
        <h2 className="text-3xl font-bold text-eco-primary-800 mb-8 text-center">How It Works</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Donating */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-eco-primary-100 rounded-lg">
                <Recycle className="w-6 h-6 text-eco-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-eco-primary-700">Donating Items</h3>
            </div>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-eco-primary-500 font-bold mt-1">•</span>
                <span>Bring clean, gently used items to the ReUSE Store during open hours</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-eco-primary-500 font-bold mt-1">•</span>
                <span>Accepted items include: furniture, kitchen supplies, school supplies, decor, clothing, and more</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-eco-primary-500 font-bold mt-1">•</span>
                <span>Our student workers will log your donation and ensure it finds a new home</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-eco-primary-500 font-bold mt-1">•</span>
                <span>All donations are tax-deductible upon request</span>
              </li>
            </ul>
          </div>

          {/* Shopping */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-eco-primary-100 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-eco-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-eco-primary-700">Shopping/Taking Items</h3>
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

      {/* Hours & Location */}
      <section className="card max-w-4xl mx-auto bg-gradient-to-br from-eco-primary-50 to-white border-2 border-eco-primary-300">
        <h2 className="text-3xl font-bold text-eco-primary-800 mb-6 text-center">Visit Us</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Location */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-eco-primary-100 rounded-lg">
                <MapPin className="w-6 h-6 text-eco-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-eco-primary-700">Location</h3>
            </div>
            <p className="text-gray-700">
              <strong>Haverford College</strong><br />
              Campus Center, Lower Level<br />
              370 Lancaster Avenue<br />
              Haverford, PA 19041
            </p>
          </div>

          {/* Hours */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-eco-primary-100 rounded-lg">
                <Clock className="w-6 h-6 text-eco-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-eco-primary-700">Hours</h3>
            </div>
            <div className="text-gray-700 space-y-1">
              <p><strong>Monday - Friday:</strong> 10:00 AM - 5:00 PM</p>
              <p><strong>Saturday:</strong> 12:00 PM - 4:00 PM</p>
              <p><strong>Sunday:</strong> Closed</p>
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
      <section className="card max-w-4xl mx-auto bg-gradient-to-br from-eco-sky-light/20 to-eco-primary-50">
        <h2 className="text-3xl font-bold text-eco-primary-800 mb-4 text-center">Our Environmental Impact</h2>
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
