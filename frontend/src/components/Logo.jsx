export const Logo = ({ variant = "dark", className = "h-10", testId = "brand-logo" }) => (
  <img
    src={`/brand/logo-${variant}.svg`}
    alt="Kalamà grab & go"
    data-testid={testId}
    className={`${className} w-auto select-none`}
    draggable={false}
  />
);

export const LogoMark = ({ variant = "yellow", className = "h-10" }) => (
  <img src={`/brand/mark-${variant}.svg`} alt="" aria-hidden="true" className={`${className} w-auto`} draggable={false} />
);
