<div align="center">

# Saffron & Stone Kitchen

### Online Food Ordering Website

A responsive single page food ordering website built with HTML5, CSS3, Bootstrap 5 and Vanilla JavaScript.

Web Engineering, Fall 2026 &nbsp;|&nbsp; Prices in Pakistani Rupee (Rs.)

[Features](#features) &nbsp;|&nbsp; [Getting Started](#getting-started) &nbsp;|&nbsp; [How Pricing Works](#how-pricing-works) &nbsp;|&nbsp; [Testing](#testing) &nbsp;|&nbsp; [Limitations](#limitations)

</div>

<br>

## About

Saffron & Stone Kitchen is a made up restaurant brand that mixes wood fired cooking with Pakistani and Mediterranean flavours. This project is its ordering website, created as a university assignment for the Web Engineering course.

Visitors can browse the menu, search and filter dishes, grab a combo bundle, fill in their details and see a receipt once the order is placed. Everything runs in the browser. There is no backend, no database and nothing to install.

<p align="right"><a href="#saffron--stone-kitchen">Back to top</a></p>

## Features

* Ten complete sections: Header and Navigation, Hero, Food Menu, About Us, Special Offers, Testimonials, Order Form with Cart, Order Confirmation Modal, Contact, and Footer
* Six core menu items with images, descriptions and prices: Burger, Pizza, Pasta, Sandwich, Fries and Drink
* Live search and category filters on the menu
* Real time cart with quantity buttons, subtotal, delivery fee and grand total
* Two combo bundles with automatic savings
* Free delivery progress bar
* Delivery or self pickup option
* Form validation on name, email, phone and address
* Order confirmation receipt with a printable layout
* Light and dark theme
* Cart saved in localStorage so a refresh does not lose it
* Responsive layout that works on phones, tablets and desktops

<details>
<summary><b>Menu and bundle prices</b></summary>
<br>

| Item | Price |
|:---|---:|
| Artisan Wagyu Smash Burger | Rs. 1,450 |
| Wood Fired Truffle Pizza | Rs. 1,850 |
| Wild Mushroom Fettuccine | Rs. 1,650 |
| Smoked Sourdough Club Sandwich | Rs. 1,150 |
| Rosemary Parmesan Hand Cut Fries | Rs. 650 |
| Botanical Citrus Saffron Cooler | Rs. 450 |

| Bundle | Price | You save |
|:---|---:|---:|
| The Saffron Feast Bundle | Rs. 3,850 | Rs. 550 |
| Artisan Lunch Express | Rs. 1,650 | See the site |

</details>

<p align="right"><a href="#saffron--stone-kitchen">Back to top</a></p>

## Built With

| Technology | Used for |
|:---|:---|
| HTML5 | Page structure using semantic tags |
| CSS3 | Custom styling with CSS variables for colours and fonts |
| Bootstrap 5.3.3 (CDN) | Grid, navbar, modal and form validation styles |
| Vanilla JavaScript (ES6) | Cart logic, calculations, search, filters and storage |
| Google Fonts | DM Serif Display and DM Sans |

No frameworks, no build tools and no jQuery.

## Getting Started

### What you need

A modern web browser such as Chrome, Edge, Firefox or Safari. An internet connection is needed once so that Bootstrap and Google Fonts can load from their CDNs.

### Run it

1. Download or clone this repository.

```bash
git clone https://github.com/your-username/OnlineFoodOrdering.git
cd OnlineFoodOrdering
```

2. Open `index.html` in your browser.

That is all. If you prefer a local server, the Live Server extension in VS Code works nicely.

## Project Structure

```text
OnlineFoodOrdering/
│
├── index.html        Page structure
├── style.css         Design tokens and custom styles
├── script.js         Menu catalog, cart state and UI logic
├── images/           Local food and restaurant images
└── README.md
```

<p align="right"><a href="#saffron--stone-kitchen">Back to top</a></p>

## How Pricing Works

All prices come from one `MENU_CATALOG` object in `script.js`. The cart never reads a price from the page itself, so editing the text in the browser inspector does not change what the customer pays.

```text
Subtotal    = sum of (catalog price x quantity) for every item
Discount    = sum of the discounts for bundles in the cart
Delivery    = 0 for pickup
              0 if subtotal is Rs. 3,000 or more, or the cart is empty
              Rs. 150 otherwise
Grand Total = Max(0, Subtotal - Discount + Delivery)
```

Cart and receipt tables are built with `document.createElement()` and `textContent`, which keeps user typed text from being run as code.

## Accessibility

<details>
<summary><b>What has been done</b></summary>
<br>

* Skip link that jumps straight to the main content
* Semantic landmarks: header, nav, main, section, article, aside and footer
* Every form input has a matching label
* Clear error messages for invalid fields
* The cart and totals use `aria-live="polite"` so screen readers hear updates
* Text and background colours checked for contrast
* Modal keeps keyboard focus inside while open

</details>

## Design Tokens

<details>
<summary><b>Colours and fonts</b></summary>
<br>

```css
:root {
  --color-ivory: #F8F5EE;
  --color-forest: #193B2E;
  --color-forest-dark: #11271F;
  --color-orange: #D96B3B;
  --color-sage: #DCE5D8;
  --color-dark: #252923;
  --color-muted: #6D7169;
  --font-serif: 'DM Serif Display', Georgia, serif;
  --font-sans: 'DM Sans', sans-serif;
}
```

</details>

<p align="right"><a href="#saffron--stone-kitchen">Back to top</a></p>

## Testing

Fifteen manual test cases were run and all of them passed.

<details>
<summary><b>See the test results</b></summary>
<br>

| ID | What was tested | Result |
|:---|:---|:---:|
| TC01 | Navbar links scroll to the right sections | Pass |
| TC02 | All six menu items load with images and prices | Pass |
| TC03 | Category filter buttons | Pass |
| TC04 | Live search for "truffle" | Pass |
| TC05 | Add to Order updates cart, badge and toast | Pass |
| TC06 | Quantity can never go below zero | Pass |
| TC07 | Feast Bundle adds four items and applies Rs. 550 off | Pass |
| TC08 | Delivery becomes free at Rs. 3,000 or more | Pass |
| TC09 | Self pickup hides address and sets delivery to Rs. 0 | Pass |
| TC10 | Empty cart cannot be submitted | Pass |
| TC11 | Empty name and bad email are rejected | Pass |
| TC12 | Valid order opens the confirmation modal | Pass |
| TC13 | Clear Order resets cart and form | Pass |
| TC14 | Contact form shows a success message | Pass |
| TC15 | 375px mobile view has no horizontal scroll | Pass |

</details>

## Limitations

This is a front end project, so a few things are only simulated.

* Orders are not sent anywhere. The receipt is shown in a modal and that is it.
* No real payments are taken. A real site would need a payment gateway such as Stripe, JazzCash, EasyPaisa or PayFast.
* There are no user accounts or order history.
* The contact form does not send email.

<details>
<summary><b>Ideas for the future</b></summary>
<br>

* A backend using Node.js, Django or ASP.NET Core
* A database such as PostgreSQL or MySQL for orders
* Login with OAuth2 or JWT
* Email receipts through SendGrid, AWS SES or Resend
* Real payment gateway integration

</details>

<p align="right"><a href="#saffron--stone-kitchen">Back to top</a></p>

## Author

**M Zain Ul Abideen**
Web Engineering, Fall 2026
Submitted 26 October 2026

## License

This project was made for academic purposes. The restaurant brand and all orders shown are fictional.s