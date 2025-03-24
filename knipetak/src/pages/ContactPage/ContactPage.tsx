import { useState } from 'react';
import NavigationBar from '../../components/NavigationBar/NavigationBar';
import Footer from '../../components/Footer/Footer';
import './ContactPage.css';

function ContactPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const { id, value } = e.target;
      setError('');
      setSuccess('');
        
      switch(id) {
        case 'name':
          setName(value);
          break;
        case 'email':
          setEmail(value);
          break;
        case 'message':
          setMessage(value);
          break;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
        
      try {
      // Her kan du implementere logikken for å sende meldingen
      // For nå simulerer vi en vellykket sending
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSuccess('Meldingen din har blitt sendt!');
        setName('');
        setEmail('');
        setMessage('');
      } catch (error) {
        setError('Kunne ikke sende meldingen. Vennligst prøv igjen.');
      } finally {
        setIsLoading(false);
      }
    };

    return (
        <>
          <NavigationBar />
          <div className="contact-container">
            <div className="contact-box">
              <h1>Kontakt Oss</h1>
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}
                    
                <div className="contact-info">
                  <p className="contact-info__text">Tlf: +47 32 55 64 22</p>
                  <div className="contact-info__divider"></div>
                  <p className="contact-info__text">Epost: Post@Knipetak.no</p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">Navn</label>
                      <textarea
                        id="name"
                        value={name}
                        onChange={handleInputChange}
                        className="form-input form-input--short"
                        placeholder="Skriv navnet ditt"
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">E-post</label>
                      <textarea
                        id="email"
                        value={email}
                        onChange={handleInputChange}
                        className="form-input form-input--short"
                        placeholder="Skriv e-postadressen din"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">Beskjed</label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={handleInputChange}
                      className="form-input form-input--tall"
                      placeholder="Skriv meldingen din her"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <button type="submit" className="submit-button" disabled={isLoading}>
                    {isLoading ? (
                      <span className="loading-spinner"></span>
                    ) : (
                      'Send Beskjed'
                    )}
                  </button>
                </form>
            </div>
          </div>
          <Footer />
        </>
    );
}

export default ContactPage; 