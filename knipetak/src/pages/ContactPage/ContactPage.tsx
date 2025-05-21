import { useState, useEffect } from "react";
import emailjs from "@emailjs/browser";
import "./ContactPage.css";
import { useAuth } from "@/context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane} from "@fortawesome/free-solid-svg-icons";
import kontakt_oss from "../../assets/images/kontakt_oss.jpg";

function ContactPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Update email when user changes (e.g., after login)
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setError("");
    setSuccess("");

    if (id === "message") setMessage(value);
    if (id === "email" && !user) setEmail(value); // Only update if not logged in
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const templateParams = {
        from_email: email,
        message,
      };

      await emailjs.send(
        "service_b9we3th",
        "template_lvwabq4",
        templateParams,
        "m7Ls2T8S_jvw9YWD6",
      );

      setSuccess("Meldingen din har blitt sendt!");
      setMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Kunne ikke sende meldingen. Vennligst prøv igjen.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="contact-container">
      <div className="contact-hero">
        <img 
          src={kontakt_oss} 
          alt="Kontakt oss" 
          className="contact-hero__image"
        />
        <div className="contact-hero__overlay">
          <h1>Kontakt Oss</h1>
        </div>
      </div>
      
      <div className="contact-box">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="contact-info">
          <p className="contact-info__text">Tlf: +47 32 55 64 22</p>
          <div className="contact-info__divider"></div>
          <p className="contact-info__text">Epost: Post@Knipetak.no</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-post</label>
            <textarea
              id="email"
              value={email}
              onChange={handleInputChange}
              className="form-input form-input--short"
              placeholder="Skriv e-postadressen din"
              required
              disabled={!!user || isLoading} // disables only if logged in or loading
            />
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

          <button
            type="submit"
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPaperPlane} />
                <span>Send Beskjed</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ContactPage;
