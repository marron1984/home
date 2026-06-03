const DONATION_LINKS = {
  once: {
    1000: "https://example.com/donate/once-1000",
    3000: "https://example.com/donate/once-3000",
    10000: "https://example.com/donate/once-10000",
    custom: "https://example.com/donate/once-custom",
  },
  monthly: {
    1000: "https://example.com/donate/monthly-1000",
    3000: "https://example.com/donate/monthly-3000",
    10000: "https://example.com/donate/monthly-10000",
    custom: "https://example.com/donate/monthly-custom",
  },
};

const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const donationForm = document.querySelector("#donation-form");
const customAmountInput = document.querySelector("#custom-amount");
const formNote = document.querySelector("#form-note");

navToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  }
});

donationForm.addEventListener("change", () => {
  const selectedAmount = donationForm.elements.amount.value;
  customAmountInput.disabled = selectedAmount !== "custom";
  if (selectedAmount !== "custom") {
    customAmountInput.value = "";
  }
});

donationForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const frequency = donationForm.elements.frequency.value;
  const selectedAmount = donationForm.elements.amount.value;
  const customAmount = Number(customAmountInput.value);

  if (selectedAmount === "custom" && (!customAmount || customAmount < 500)) {
    formNote.textContent = "自由入力の場合は500円以上の金額を入力してください。";
    customAmountInput.focus();
    return;
  }

  const donationUrl = new URL(DONATION_LINKS[frequency][selectedAmount]);
  if (selectedAmount === "custom") {
    donationUrl.searchParams.set("amount", String(customAmount));
  }

  formNote.textContent = "決済ページを開いています。ありがとうございます。";
  window.location.href = donationUrl.toString();
});

customAmountInput.disabled = true;
