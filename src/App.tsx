import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import '@/App.scss';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Header from '@/components/Header/Header';
import Hero from '@/components/Hero/Hero';
import Stats from '@/components/Stats/Stats';
import Platform from '@/components/Platform/Platform';
import Audience from '@/components/Audience/Audience';
import AppPromo from '@/components/AppPromo/AppPromo';
import Footer from '@/components/Footer/Footer';
import Login from '@/pages/AuthPages/Login';
import Register from '@/pages/AuthPages/Register';
import Dashboard from '@/pages/Dashboard/Dashboard';
import AdminApp from '@/admin/AdminApp';

type View = 'landing' | 'login' | 'register';

function PublicSite() {
  const { isAuthenticated } = useAuth();
  const [view, setView] = useState<View>('landing');

  const goTo = (nextView: View) => () => setView(nextView);

  let main;
  if (isAuthenticated) {
    main = <Dashboard />;
  } else if (view === 'login') {
    main = <Login onSuccess={goTo('landing')} onNavigateToRegister={goTo('register')} />;
  } else if (view === 'register') {
    main = <Register onSuccess={goTo('landing')} onNavigateToLogin={goTo('login')} />;
  } else {
    main = (
      <>
        <Hero />
        <Stats />
        <Platform />
        <Audience />
        <AppPromo />
      </>
    );
  }

  return (
    <div className="app">
      <Header onLoginClick={goTo('login')} onRegisterClick={goTo('register')} onHomeClick={goTo('landing')} />
      <main>{main}</main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/*" element={<PublicSite />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
