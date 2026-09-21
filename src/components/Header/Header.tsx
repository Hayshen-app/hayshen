import { useEffect, useId, useState } from 'react';
import { Menu, X } from 'lucide-react';
import '@/components/Header/header.scss';
import { HayShenLogo } from '@/components/icons/HayShenLogo';

const navigation = [
  { label: 'Գլխավոր', href: '#home' },
  { label: 'Ծառայություններ', href: '#services' },
  // { label: 'Տեխնիկա', href: '#equipment' },
  { label: 'Մեր մասին', href: '#about' },
];

interface HeaderProps {
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
  onHomeClick?: () => void;
}

function Header({ onLoginClick, onRegisterClick }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    const handleResize = () => {
      if (window.innerWidth > 870) {
        setIsMenuOpen(false);
      }
    };

    document.body.classList.add('menu-open');
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return () => {
      document.body.classList.remove('menu-open');
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header
      className={[
        'appHeader',
        isScrolled ? 'appHeader--scrolled' : '',
        isMenuOpen ? 'appHeader--menu-open' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="appHeader__container">
        <a
          className="logoBox"
          href="#home"
          aria-label="HayShen"
          onClick={closeMenu}
        >
          <HayShenLogo
            className="appHeader__logo"
            role="img"
            aria-label="HayShen"
          />
        </a>

        <div className="appHeader__drawer" id={menuId}>
          <nav className="menuBox" aria-label="Հիմնական նավիգացիա">
            <ul className="appHeader__menu">
              {navigation.map((item, index) => (
                <li key={item.href}>
                  <a
                    className={index === 0 ? 'is-active' : undefined}
                    href={item.href}
                    onClick={closeMenu}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="buttonsBox buttonsBox--mobile">
            <button
              type="button"
              className="appHeader__button appHeader__button--outline"
              onClick={() => {
                closeMenu();
                onLoginClick?.();
              }}
            >
              Մուտք գործել
            </button>
            <button
              type="button"
              className="appHeader__button appHeader__button--filled"
              onClick={() => {
                closeMenu();
                onRegisterClick?.();
              }}
            >
              Գրանցվել
            </button>
          </div>
        </div>

        <div className="buttonsBox buttonsBox--desktop">
          <button
            type="button"
            className="appHeader__button appHeader__button--outline"
            onClick={() => onLoginClick?.()}
          >
            Մուտք գործել
          </button>
          <button
            type="button"
            className="appHeader__button appHeader__button--filled"
            onClick={() => onRegisterClick?.()}
          >
            Գրանցվել
          </button>
        </div>

        <button
          className="appHeader__burger"
          type="button"
          aria-label={isMenuOpen ? 'Փակել ընտրացանկը' : 'Բացել ընտրացանկը'}
          aria-controls={menuId}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <button
        className="appHeader__backdrop"
        type="button"
        aria-label="Փակել ընտրացանկը"
        tabIndex={isMenuOpen ? 0 : -1}
        onClick={closeMenu}
      />
    </header>
  );
}

export default Header;
