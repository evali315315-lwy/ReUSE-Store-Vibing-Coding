import { Mail, MapPin } from 'lucide-react';
import squirrelLogo from '../../assets/squirrel.svg';

function Footer() {
  return (
    <footer className="bg-gradient-to-r from-eco-primary-800 via-eco-teal-dark to-eco-primary-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Contact Info with Squirrel */}
          <div className="flex items-center gap-6">
            <img src={squirrelLogo} alt="Black Squirrel" className="w-10 h-10 opacity-80" />
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
