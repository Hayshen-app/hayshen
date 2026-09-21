import { ArrowRightLeft, Boxes, Handshake, LoaderCircle } from 'lucide-react';
import heroImage from '@/assets/images/heroImage.webp';
import '@/components/Hero/hero.scss';

const benefits = [
  {
    title: 'Մեկ հարթակ',
    text: 'տեխնիկա և մասնագետներ',
    Icon: Boxes,
  },
  {
    title: 'Ուղիղ կապ',
    text: 'առանց ավելորդ միջնորդների',
    Icon: Handshake,
  },
  {
    title: 'Պարզ գործընթաց',
    text: 'որոնումից մինչև պատվեր',
    Icon: ArrowRightLeft,
  },
];

function Hero() {
  return (
    <section className="hero" id="home" aria-label="HayShen">
      <div className="hero__container">
        <div className="hero__main">
          <div className="hero__content">
            <h1>
              Ամեն ինչ շինարարության համար՝ <span>մեկ հարթակում։</span>
            </h1>

            <p>
              HayShen-ը նոր սերնդի շինարարական հարթակ է, որը միավորում է տեխնիկան, շինանյութերը,
              ծառայությունները, մասնագետներին և պատվերները՝ դարձնելով համագործակցությունը արագ,
              պարզ և վստահելի։
            </p>

            {/*<div className="hero__actions">*/}
            {/*  <a className="hero__button hero__button--primary" href="#equipment">*/}
            {/*    Տեխնիկա պատվիրել*/}
            {/*  </a>*/}
            {/*  <a className="hero__button hero__button--secondary" href="#services">*/}
            {/*    Մասնագետ գտնել*/}
            {/*  </a>*/}
            {/*</div>*/}
          </div>

          <div className="hero__benefits">
            {benefits.map(({ title, text, Icon }) => (
              <div className="hero__benefit" key={title}>
                <span className="hero__benefit-icon" aria-hidden="true">
                  <Icon />
                </span>
                <span>
                  <strong>{title}</strong>
                  <small>{text}</small>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero__visual">
          <div className="hero__image">
            <img src={heroImage} alt="" />
          </div>

          <div className="hero__rating">
            <div className="hero__status-icon" aria-hidden="true">
              <LoaderCircle />
            </div>
            <div>
              <strong>Մշակման փուլում է</strong>
              <p>Մենք կառուցում ենք HayShen-ի առաջին տարբերակը</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
