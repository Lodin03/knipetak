import { useState, useEffect } from "react";
import emailjs from "@emailjs/browser";
import "./ContactPage.css";
import { useAuth } from "@/context/AuthContext";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const templateParams = {
      from_email: email,
      message,
    };

    emailjs
      .send(
        "service_b9we3th",
        "template_lvwabq4",
        templateParams,
        "m7Ls2T8S_jvw9YWD6"
      )
      .then((response) => {
        console.log("SUCCESS!", response.status, response.text);
        setSuccess("Meldingen din har blitt sendt!");
        setMessage("");
      })
      .catch((err) => {
        console.error("FAILED...", err);
        setError("Kunne ikke sende meldingen. Vennligst prøv igjen.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <>
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
                <span className="loading-spinner"></span>
              ) : (
                "Send Beskjed"
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default ContactPage;
