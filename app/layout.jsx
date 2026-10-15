import './styles.css';

export const metadata = {
  title: 'Enquiry Desk | Customer enquiry CRM prototype',
  description: 'A synthetic, local-only customer enquiry and follow-up workflow prototype.'
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
