# Aathmika Sarveswaran — Developer Portfolio

A responsive, static personal portfolio built with HTML, CSS, and vanilla JavaScript for the Datheon Full Stack Web Development Internship Task 1. It presents an introduction, background, skills, selected projects, résumé area, and contact details.

> Personal profile links, email, education details, project repositories, live demos, and a résumé PDF are placeholders. Update them with your own accurate information before sharing the site.

## Features

- Dark theme by default, optional light theme, and saved theme preference.
- Responsive navigation with a mobile menu and active section indication.
- Intro, about, education, and categorized technical skills.
- Three project cards with local preview artwork and detail dialogs.
- Résumé area ready for your own PDF.
- Accessible contact form with browser-side validation. It does not send messages.
- Scroll reveal effects, reduced-motion support, and back-to-top links.
- No framework, build step, or backend required.

## Technologies

HTML5, CSS3 (Grid and Flexbox), and vanilla JavaScript (ES6+). Google Fonts are loaded from Google Fonts when the visitor has an internet connection; system fonts remain available as fallback.

## Folder structure

```text
MyDeveloperPortfolio/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
    ├── images/
    │   ├── profile.svg
    │   ├── travelmate.svg
    │   ├── school360.svg
    │   └── toytopia.svg
    └── documents/
        └── (add resume.pdf)
```

The SVGs are original, lightweight placeholders, not personal photos or actual application screenshots. Replace them with your own images if available. You can use JPG or PNG instead by updating each image `src` in `index.html` and the matching project image path in `script.js`.

## Run locally

1. Open this folder in Visual Studio Code.
2. Install the **Live Server** extension if it is not already installed.
3. Right-click `index.html` and choose **Open with Live Server**.
4. The site opens in your browser. Save edits to see them refresh.

You can also open `index.html` directly in a modern browser; Live Server is convenient for development.

## Customize your information

1. In `index.html`, update the name, introduction, education placeholder, project text, email, GitHub, and LinkedIn links.
2. Change the `<title>` and meta description near the top of the HTML.
3. Replace the profile and project artwork in `assets/images/` with your own files, and update the image paths in both HTML and `script.js` when filenames change.
4. Add your real project repository/demo URLs to each project card. The current buttons show a reminder instead of linking to invented URLs.
5. Add your own PDF at `assets/documents/resume.pdf`. Then change the résumé button in `index.html` to an anchor such as `<a class="button button-primary" href="assets/documents/resume.pdf" download>Download CV</a>` and remove the placeholder click handler from `script.js`.

## Add another project

Copy a `.project-card` block in `index.html`, update its text and `data-project` value, add an image in `assets/images/`, and add a matching entry in the `projects` object near the top of `script.js`. The entry needs a `name`, `category`, `image`, `description`, and `technologies` array. Use real repository or demo links only after you have them.

## Contact form

The form checks the name, email, subject, and message in the visitor’s browser and reports whether the fields are valid. It does not send or store the message. To receive submissions, connect a backend endpoint or a trusted email service, update the form submit handler in `script.js`, and review that service’s privacy and security requirements.

## Deploy

### GitHub Pages

1. Create a GitHub repository and push this folder to its default branch.
2. In the repository, open **Settings → Pages**.
3. Choose **Deploy from a branch**, select the default branch and `/ (root)`, then save.
4. Wait for the Pages URL to appear in that settings panel. This is a static site, so there is no build command.

### Vercel

1. Push the folder to a GitHub repository.
2. Import that repository in Vercel.
3. Select the framework preset **Other** (or static site), leave the build command empty, and set the output/root directory to the project root.
4. Deploy. Vercel will serve `index.html` and the asset folders as static files.

## Screenshot

Screenshot placeholder: capture the running site and add the image here, for example `![Portfolio screenshot](assets/images/portfolio-screenshot.png)`.

## Author

**Aathmika Sarveswaran** — aspiring full stack developer. Replace the placeholder profile and contact links with your real profiles before deployment.
