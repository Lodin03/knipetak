import NavigationBar from '../../components/NavigationBar/NavigationBar';
import Footer from '../../components/Footer/Footer';
import './ContactPage.css';

function ContactPage() {
    return (
        <div>
            <NavigationBar />
            <div className="contact-container">
                <h1>Kontakt oss</h1>
            </div>
            <Footer />
        </div>
    );
}

export default ContactPage;