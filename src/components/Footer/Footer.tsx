import { ExternalLink } from 'lucide-react';
import { HayShenLogo } from '@/components/icons/HayShenLogo';
import '@/components/Footer/footer.scss';

const links = [
  { label: 'Գլխավոր', href: '#home' },
  { label: 'Ծառայություններ', href: '#services' },
  { label: 'Տեխնիկա', href: '#equipment' },
  { label: 'Մեր մասին', href: '#about' },
];

const socialLinks = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/hayshen.am/',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle
          cx="12"
          cy="12"
          r="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="17.5" cy="6.5" r="1.3" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61565974949417',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M14.2 8.4V6.8c0-.8.4-1.2 1.3-1.2h1.7V2.8c-.8-.1-1.7-.2-2.5-.2-2.6 0-4.4 1.6-4.4 4.5v1.3H7.5v3.2h2.8v9.8h3.5v-9.8h2.9l.5-3.2h-3z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    label: 'TikTok',
    href: '#tiktok',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M15.8 3c.3 2.4 1.7 3.9 4.2 4.1v3.4c-1.5 0-2.9-.5-4.1-1.3v5.8c0 4.2-2.8 6.5-6.1 6.5-3 0-5.8-2-5.8-5.4 0-3.8 3.4-6.1 7-5.3v3.5c-1.6-.5-3.4.5-3.4 1.9 0 1.2 1 2 2.2 2 1.4 0 2.4-.8 2.4-2.8V3z"
          fill="currentColor"
        />
      </svg>
    ),
  },
];

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__brand">
          <HayShenLogo
            className="footer__logo"
            width={176}
            height={42}
            color="#ffffff"
            aria-label="HayShen"
          />
          <p>
            Ստեղծվող հարթակ՝ շինարարական տեխնիկան, մասնագետներին և
            պատվիրատուներին միավորելու համար։
          </p>
          <div className="footer__socials">
            {socialLinks.map((social) => (
              <a href={social.href} aria-label={social.label} key={social.href}>
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        <nav className="footer__column" aria-label="Footer navigation">
          <h2>HayShen</h2>
          {links.map((link) => (
            <a href={link.href} key={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="footer__column">
          <h2>Հարթակը</h2>
          <a href="#services">Ինչպես է աշխատելու</a>
          <a href="#about">Ում համար է</a>
          <a href="#app-promo">Բջջային հավելված</a>
          <a href="#privacy">Գաղտնիություն</a>
        </div>

        <div className="footer__column footer__contact">
          <h2>Կապ մեզ հետ</h2>
          <p>HayShen-ը դեռ մշակման փուլում է։</p>
          <p>Կապի պաշտոնական տվյալները կհրապարակվեն գործարկումից առաջ։</p>
        </div>
      </div>

      <div className="footer__bottom">
        <p>
          © {new Date().getFullYear()} HayShen. Բոլոր իրավունքները պաշտպանված
          են։
        </p>
        <div className="footer__bottomMeta">
          <a
            className="footer__creator"
            href="https://www.taan-tech.com/"
            target="_blank"
            rel="noreferrer"
          >
            <span>Created by TAAN TECHNOLOGIES</span>
            <ExternalLink aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
