---
layout: page
title: About Raviel
tags: [about, Jekyll, theme, moon]
date: 2024-02-11
comments: false
---

<center>currently a member of <a href="https://www.facebook.com/hisc.fit.hcmute.edu.vn/"><b>HISC</b></a>.</center>
<p align="center">
  <img src="/assets/img/logo_HISC.jpg" alt="Centered HISC logo" width="100">
</p>

 <div style="display: flex; align-items: flex-start;">

  <!-- Left side image -->
  <div class="responsive-image-container">
    <img src="/assets/img/real_pic.jpg" alt="not a deep fake one lmao" class="responsive-image">
</div>

<style>
    .responsive-image-container {
        display: flex;
        justify-content: center;
        flex: 0 1 auto;
        padding-right: 20px;
    }

    .responsive-image {
        max-width: 100%;
        height: auto;
        display: block;
    }

    @media (max-width: 768px) {
        .responsive-image-container {
            padding-right: 10px; /* Adjust padding for smaller screens */
        }

        .responsive-image {
            max-width: 90%; /* Reduce the image size slightly for smaller screens */
        }
    }

    @media (max-width: 480px) {
        .responsive-image-container {
            padding-right: 5px; /* Further reduce padding for very small screens */
        }

        .responsive-image {
            max-width: 80%; /* Further reduce the image size for very small screens */
        }
    }
</style>


  <!-- Right side text -->
  <div style="flex: 1;">

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

## Random Pictures for you

{% capture images %}
https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/master/assets/img/baelz.jpg
https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/master/assets/img/IRYS.jpg
https://raw.githubusercontent.com/raviyelna/raviyelna.github.io/master/assets/img/waifu.jpg
{% endcapture %} 
{% include gallery images=images caption="Have some beautiful pictures" cols=3 %}

