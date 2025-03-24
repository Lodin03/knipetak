let slideCurrent = 0;

function SlideShow(): void {
let slides = document.querySelectorAll<HTMLElement>(".slide")

slides.forEach(slide => slide.style.display = "none")

slideCurrent++
if(slideCurrent > slides.length) {slideCurrent = 1}

slides[slideCurrent - 1].style.display = "block"

setTimeout(SlideShow, 3000 )

}
SlideShow()