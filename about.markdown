---
layout: page
title: About Raviel
tags: [about, Jekyll, theme, moon]
date: 2024-02-11
comments: false
---

<center>Currently a member of <a href="https://www.facebook.com/hisc.fit.hcmute.edu.vn/"><b>HISC</b></a>.</center>
<p align="center">
  <img src="/assets/img/logo_HISC.jpg" alt="Centered HISC logo" width="100">
</p>

<div class="flex-container">
  <!-- Image container -->
  <div class="image-container">
    <img src="/assets/img/real_pic.jpg" alt="not a deep fake one lmao" class="responsive-image">
  </div>

  <!-- Right side text -->
  <div class="text-container">
    <h2>Informations</h2>
    <ul>
      <li><strong>Fullname:</strong> Lê Nhựt Quốc Khang</li>
      <li><strong>DoB:</strong> 28/03/2005</li>
      <li><strong>Currently a 2nd year Student</strong></li>
      <li><strong>Major:</strong> Information Security</li>
      <li><strong>Hobbies:</strong> read Novels, Listen to music</li>
      <li><strong>CTFs roles:</strong> Digital Forensics, Reverse engineering</li>
    </ul>

    <h2>Contacts</h2>
    <ul>
      <li><strong>Discord:</strong> raviyelna</li>
      <li><strong>Facebook:</strong> <a href="https://www.facebook.com/Kann.Raviel">Lê Nhựt Quốc Khang</a></li>
      <li><strong>Email:</strong> raviel.insec@gmail.com</li>
      <li><strong>hackmd:</strong> <a href="https://hackmd.io/@Raviyelna">Raviyelna</a></li>
    </ul>
  </div> <!-- End of right-side text div -->
</div> <!-- End of flex container div -->

<style>
  /* Flex container for image and text */
  .flex-container {
    display: flex;
    flex-wrap: wrap; /* Allows content to wrap on smaller screens */
    align-items: flex-start; /* Align items at the start of the container */
    margin: 20px 0; /* Space around the container */
    gap: 20px; /* Space between the items */
  }

  /* Responsive image container */
  .image-container {
    flex: 0 1 330px; /* Image will take up to 330px and shrink if needed */
    max-width: 100%; /* Image container will not exceed its parent's width */
  }

  .responsive-image {
    max-width: 100%; /* Image scales with its container */
    height: auto; /* Maintain aspect ratio */
    display: block; /* Remove any inline spacing issues */
  }

  /* Responsive text container */
  .text-container {
    flex: 1; /* Allows the text container to take remaining space */
    padding: 10px; /* Padding for spacing inside the text container */
  }

  /* General text styling */
  .text-container h2 {
    font-size: 1.5rem; /* Relative font size for responsiveness */
    margin-bottom: 10px;
  }

  .text-container ul {
    list-style-type: none; /* Remove default list style */
    padding: 0; /* Remove default padding */
  }

  .text-container li {
    font-size: 1rem; /* Relative font size for responsiveness */
    margin-bottom: 5px; /* Space between list items */
  }

  .text-container a {
    color: #0066cc; /* Link color */
    text-decoration: none; /* Remove underline */
  }

  /* Media queries for responsiveness */
  @media (max-width: 768px) {
    .flex-container {
      flex-direction: column; /* Stack image and text on smaller screens */
      align-items: center; /* Center content */
    }

    .image-container {
      padding-right: 0; /* Remove padding on smaller screens */
      margin-bottom: 20px; /* Add space between image and text when stacked */
    }

    .text-container h2 {
      font-size: 1.3rem; /* Adjust heading size for smaller screens */
    }

    .text-container li {
      font-size: 0.9rem; /* Adjust text size for smaller screens */
    }
  }

  @media (max-width: 480px) {
    .text-container h2 {
      font-size: 1.2rem; /* Further reduce heading size for very small screens */
    }

    .text-container li {
      font-size: 0.8rem; /* Further reduce text size for very small screens */
    }
  }
</style>

## Random Pictures for you

{% capture images %}
https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/master/assets/img/baelz.jpg
https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/master/assets/img/IRYS.jpg
https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/master/assets/img/waifu.jpg
{% endcapture %} 
{% include gallery images=images caption="Have some beautiful pictures" cols=3 %}
