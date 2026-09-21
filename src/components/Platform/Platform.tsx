import {
  ArrowUpRight,
  BadgeCheck,
  CalendarCheck,
  HardHat,
  Search,
  Truck,
} from 'lucide-react';
import '@/components/Platform/platform.scss';

const features = [
  {
    number: '01',
    title: 'Տեխնիկայի որոնում',
    text: 'Գտեք անհրաժեշտ շինարարական տեխնիկան՝ ըստ տեսակի, գտնվելու վայրի և գնի։',
    Icon: Search,
  },
  {
    number: '02',
    title: 'Շինանյութի որոնում',
    text: 'Գտեք անհրաժեշտ շինանյութը մեկ վայրում:',
    Icon: HardHat,
  },
  {
    number: '03',
    title: 'Մասնագետների որոնում',
    text: 'Գտեք վստահելի շինարարներ, վարպետներ և մասնագիտացված ծառայություններ։',
    Icon: BadgeCheck,
  },
  {
    number: '04',
    title: 'Առցանց պատվեր',
    text: 'Ուղարկեք հարցում և համաձայնեցրեք աշխատանքի օրը պարզ քայլերով։',
    Icon: CalendarCheck,
  },
  {
    number: '05',
    title: 'Տեխնիկայի տեղադրում',
    text: 'Ավելացրեք ձեր տեխնիկան հարթակում և ստացեք նոր պատվերներ ու հաճախորդներ։',
    Icon: Truck,
  },
];

function Platform() {
  return (
    <section className="platform" id="services">
      <span id="equipment" className="platform__anchor" aria-hidden="true" />
      <div className="platform__container">
        <div className="platform__intro">
          <p className="platform__eyebrow">HayShen հարթակ</p>
          <h2>
            Ամեն ինչ՝{' '}
            <span>շինարարության համար</span>
          </h2>
          <p>
            Մեկ հարթակ, որտեղ շինարարական տեխնիկան, շինանյութերը, ծառայություններն ու պատվերները
            հասանելի են ընդամենը մի քանի քայլով։ Ավելի արագ որոնում, ավելի խելացի ընտրություն և ավելի
            արդյունավետ համագործակցություն։
          </p>
          <a href="#about">
            Իմանալ ավելին
            <ArrowUpRight size={18} />
          </a>
        </div>

        {features.map(({ number, title, text, Icon }) => (
          <article className="platform__card" key={number}>
            <span className="platform__number">{number}</span>
            <span className="platform__icon" aria-hidden="true">
              <Icon />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}

        <article className="platform__highlight">
          <div>
            <p>Մեր նպատակը</p>
            <h3>Ստեղծել միասնական հարթակ, որտեղ շինարարության յուրաքանչյուր փուլ կազմակերպվում է հեշտ,
              արագ և վստահելի։</h3>
          </div>
          <ArrowUpRight aria-hidden="true" />
        </article>
      </div>
    </section>
  );
}

export default Platform;
