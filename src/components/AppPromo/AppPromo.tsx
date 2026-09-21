import '@/components/AppPromo/appPromo.scss';
import appPhones from '@/assets/images/app-phones.png';
import AppleIcon from '@/components/icons/AppleIcon';
import GooglePlayIcon from '@/components/icons/GooglePlayIcon';

function AppPromo() {
  return (
    <section className="appPromo" id="app-promo" aria-labelledby="app-promo-title">
      <div className="appPromo__container">
        <div className="appPromo__phones">
          <img src={appPhones} alt="HayShen mobile application preview" />
        </div>

        <div className="appPromo__content">
          <span className="appPromo__label">Շուտով</span>
          <h2 id="app-promo-title">HayShen-ը նաև ձեր հեռախոսում</h2>
          <p>
            Հավելվածի միջոցով հնարավոր կլինի գտնել տեխնիկա, կապվել
            սեփականատիրոջ հետ և հետևել պատվերի ընթացքին ցանկացած վայրից։
          </p>

          <div className="appPromo__stores" aria-label="Հավելվածների խանութներ">
            <span className="appPromo__store">
              <GooglePlayIcon />
              <span>
                <small>Շուտով հասանելի</small>
                <strong>Google Play</strong>
              </span>
            </span>
            <span className="appPromo__store">
              <AppleIcon />
              <span>
                <small>Շուտով հասանելի</small>
                <strong>App Store</strong>
              </span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AppPromo;
