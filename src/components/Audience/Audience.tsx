import {
  BadgeCheck,
  Handshake,
  HardHat,
  UserRoundSearch,
} from 'lucide-react';
import '@/components/Audience/audience.scss';

const audiences = [
  {
    title: 'Պատվիրատուների համար',
    text: 'Գտեք շինարարական տեխնիկա, շինանյութ, ծառայություններ և մասնագետներ, համեմատեք առաջարկները\n' +
        'և ընտրեք լավագույն տարբերակը։',
    Icon: UserRoundSearch,
  },
  {
    title: 'Մատակարարների համար',
    text: 'Ներկայացրեք ձեր տեխնիկան, շինանյութը կամ ծառայությունները, բարձրացրեք տեսանելիությունը և\n' +
        'ստացեք նոր պատվերներ։',
    Icon: HardHat,
  },
];

function Audience() {
  return (
    <section className="audience" id="about">
      <div className="audience__container">
        <div className="audience__visual" aria-hidden="true">
          <div className="audience__panel audience__panel--main">
            <span>HayShen</span>
            <strong>Մեկ կապող հարթակ</strong>
            <p>Տեխնիկա · Մասնագետ · Պատվեր</p>
          </div>

          <div className="audience__panel audience__panel--top">
            <BadgeCheck />
            <span>Հստակ պրոֆիլներ</span>
          </div>

          <div className="audience__panel audience__panel--bottom">
            <Handshake />
            <div>
              <strong>Ուղիղ կապ</strong>
              <small>պատվիրատուի և կատարողի միջև</small>
            </div>
          </div>

          <span className="audience__shape audience__shape--one" />
          <span className="audience__shape audience__shape--two" />
        </div>

        <div className="audience__content">
          <p className="audience__eyebrow">Ում համար է HayShen-ը</p>
          <h2>
            Երկու կողմ,
            <span> մեկ պարզ լուծում</span>
          </h2>
          <p className="audience__lead">
            Անկախ նրանից՝ դուք փնտրում եք տեխնիկա, շինանյութ կամ մասնագետ, թե ցանկանում եք ներկայացնել ձեր
            ծառայությունները, HayShen-ը ստեղծված է ձեզ համար։
          </p>

          <div className="audience__cards">
            {audiences.map(({ title, text, Icon }) => (
              <article key={title}>
                <Icon aria-hidden="true" />
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>

          <ul>
            <li>Ավելի քիչ ժամանակ՝ որոնման վրա</li>
            <li>Ավելի հստակ ընտրություն և պայմաններ</li>
            <li>Հարմար կապ առանց բարդ գործընթացների</li>
          </ul>

          {/*<a href="#home">*/}
          {/*  Բացահայտել HayShen-ը*/}
          {/*  <ArrowRight size={18} />*/}
          {/*</a>*/}
        </div>
      </div>
    </section>
  );
}

export default Audience;
