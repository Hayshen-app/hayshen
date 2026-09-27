interface CompanyLogoProps {
  logoUrl: string | null;
  size?: 'sm' | 'lg';
}

function CompanyLogo({ logoUrl, size = 'sm' }: CompanyLogoProps) {
  if (!logoUrl) {
    return (
      <div className={`company-logo company-logo--placeholder${size === 'lg' ? ' company-logo--large' : ''}`}>
        No logo
      </div>
    );
  }
  return <img className={`company-logo${size === 'lg' ? ' company-logo--large' : ''}`} src={logoUrl} alt="Logo" />;
}

export default CompanyLogo;
