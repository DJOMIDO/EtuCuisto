# 14.05.2022
# Projet EtuCuisto
# Version optimale
# Site cible : www.marmiton.org

import sys
import requests
from bs4 import BeautifulSoup
from lxml import html
import json

"""
---Communication HTML-PHP-Python---
1. Enregistrement de la racine de l'URL de la page cible qu'on souhaite crawler dans une variable
2. Récupération des données sérialisées saisies par l'utilisateur depuis la page accueil.html
3. Génération d'une URL valide afin de pouvoir continuer éventuellement à crawler les infos souhaitées sur cette URL
"""
racine = "https://www.marmiton.org/recettes/recherche.aspx?"
#serialize = "aqt=boeuf&dt=platprincipal&ttlt=45"
serialize = sys.argv[1]
urlcombi = racine + serialize
# print(urlcombi)

"""
---Scrapeur---
1. Obtention du code source de la page coresspondant à l'URL formée
2. Extraction des informations qui nous intéressent avec BeautifulSoup
3. Analyse des informations extraites et classement dans un un dictionnaire Python
4. Extraction de chaque nom et lien des recettes obtenues grâce à l'URL
5. Affichage des résultats de Python converti en chaîne
"""
recipe_links = ""
error_list = ""
max == 0
try:
    page_source = requests.get(urlcombi).text
    soup = BeautifulSoup(page_source, 'lxml')
    for items in soup.find_all('script', attrs={"type": "application/ld+json"}):
        try:
            my_recipe_text = items.text
            my_recipe = json.loads(my_recipe_text)
            i = 0
            try:
                max = my_recipe["numberOfItems"]
                while i <= max - 1:
                    # recipe_links += my_recipe["itemListElement"][i]["name"] + "<br>"
                    recipe_links += "<a href=https://www.marmiton.org" + my_recipe["itemListElement"][i]["url"] + " >" + \
                                    my_recipe["itemListElement"][i]["name"] + "</a> <br>"
                    i += 1

            except:
                error_list += "Une erreur a eu lieu " + str(i)
        except:
            error_list += "Une erreur a eu lieu dans json."
except:
    error_list += "Une erreur a eu lieu dans requests.get"

results = recipe_links

if max == 0:
    print(json.dumps("Désolé, pas de résultats."))
else:
    print(json.dumps("Voici les résultats de votre recherche sur Marmiton : <br>" + "<br>" + results))
