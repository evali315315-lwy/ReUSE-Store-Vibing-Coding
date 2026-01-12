import { Mail, MapPin } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-eco-primary-800 text-white mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Contact Info */}
          <div className="flex flex-col md:flex-row gap-4 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>Haverford College</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>reuse@haverford.edu</span>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-sm text-eco-primary-200">
            © {new Date().getFullYear()} Haverford College ReUSE Store
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
