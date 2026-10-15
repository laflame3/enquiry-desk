import './styles.css';

export const metadata = {
  title: 'Fairway Desk | Golf club enquiry CRM prototype',
  description: 'A synthetic, local-only membership enquiry workflow prototype.'
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
