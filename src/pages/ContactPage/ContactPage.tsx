import "../ContactPage/ContactPage.css"
import NavigationBar from "../../components/NavigationBar/NavigationBar.tsx";
import Footer from "../../components/Footer/Footer.tsx";

const ContactPage = () => {
return(
    <>
    <NavigationBar />

    <div className="container">
     
<div className="box">
    
<div className="Info">
<p className="Text"> Tlf : +47 32 55 64 22 </p>
<div className="line"></div>
<p className="Text"> Epost : Post@Knipetak.no </p>
<div className="line"></div>
<br></br>
<div className="Inputs">
         <textarea className="input" placeholder="Navn"></textarea>
         <textarea className="input1" placeholder="Epost"></textarea>
         </div>
         <div className="extraInput">
         <textarea className="input2" placeholder="Beskjed"></textarea>
         </div>
         <button className="button"> Send Beskjed</button>      
</div>


</div>
</div>

<Footer/>
    </>
)
}
export default ContactPage