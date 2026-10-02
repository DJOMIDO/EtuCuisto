### Mode d'emploi d'EtuCuisto

#### Connection & Inscription

La première page de notre site est la page de connexion *[login.html](http://i3l.univ-grenoble-alpes.fr/~maxiao/EtuCuisto/Scripts/login.html)*. À partir de cette page, les identifiants entrés sont envoyés au fichier *<u>verifAuthentif.php</u>* qui va autoriser ou non l’accès à notre site en interrogeant la base de données par le biais du fichier *<u>connexion.php</u>*.

Nous avons également un fichier *<u>inscription.php</u>* pour permettre à de nouveaux utilisateurs d’accéder à notre site. Les identifiants entrés seront enregistrés dans la base de données par le biais du fichier *<u>connexion.php</u>*.

#### Accueil

Une fois l’accès autorisé, la page d’accueil *[accueil.html](http://i3l.univ-grenoble-alpes.fr/~maxiao/EtuCuisto/Scripts/accueil.html)* s’ouvre. C’est sur cette page que l’utilisateur va réaliser sa recherche en sélectionnant les **ingrédients**, **type de plat**, **ustensiles**, **temps de préparation** et **nombre de personnes**.

#### Validation de requête

En cliquant sur le bouton « **Valider** », une requête Ajax se déclenche : les données sélectionnées sont alors envoyées au script PHP *<u>envoie.php</u>*. Ce dernier lance le script Python *<u>scrappeur.py</u>* qui va se charger de réaliser la recherche sur le site [Marmiton](https://www.marmiton.org/) et de renvoyer les résultats au script PHP, qui les renvoie à Ajax, qui les affiche sur la page d’accueil.

#### Liste d'envies, Qui sommes-nous, FAQs

Notre site possède aussi une page *<u>favori.html</u>* censée regrouper les recettes préférées de l’utilisateur, mais par manque de temps nous n’avons pas pu la rendre opérationnelle. Il y a une page *<u>about_us.html</u>* qui donne quelques informations sur les créateurs du site, leurs noms et adresses email, ainsi que les coordonnées du siège social. Cette page permet également de laisser un message sur le site et il sera envoyé au script PHP *<u>sendmessage.php</u>*. Enfin, la page *<u>faq.html</u>* propose quelques questions afin de permettre à l’utilisateur de mieux comprendre le fonctionnement et l’objectif du site et de ses créateurs.

#### Liste des documents

Les pages d’accueil, de connexion et la FAQ possèdent des feuilles de style, respectivement *<u>accueil.css</u>*, *<u>login.css</u>* et *<u>faq.css</u>*. Le reste des fichiers sont des images qui alimentent le site.

Nous avons dû utiliser jQuery pour réaliser ce site, il y a donc un fichier *j<u>query-3.6.0.min.js</u>*.

