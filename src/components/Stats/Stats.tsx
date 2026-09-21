import { ClipboardCheck, Contact, Search, SlidersHorizontal } from 'lucide-react';
import '@/components/Stats/stats.scss';

const stats = [
  {
    value: 'Որոնեք',
    label: 'Գտեք անհրաժեշտ ապրանքը կամ ծառայությունը',
    Icon: Search,
  },
  {
    value: 'Համեմատեք',
    label: 'Առաջարկներն ու վարկանիշները',
    Icon: SlidersHorizontal,
  },
  {
    value: 'Ընտրեք',
    label: 'Լավագույն տարբերակը ձեզ համապատասխան',
    Icon: Contact,
  },
  {
    value: 'Պատվիրեք',
    label: 'Արագ և անվտանգ',
    Icon: ClipboardCheck,
  },
];

function Stats() {
  return (
    <section className="stats" aria-labelledby="stats-title">
      <div className="stats__container">
        <h2 id="stats-title">Ի՞նչ կտա HayShen-ը</h2>

        <div className="stats__list">
          {stats.map(({ value, label, Icon }) => (
            <article className="stats__item" key={value}>
              <span className="stats__icon" aria-hidden="true">
                <Icon />
              </span>
              <div>
                <strong>{value}</strong>
                <p>{label}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Stats;
