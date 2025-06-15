import axios from "axios"; 

const evaluateCodeDirect = async ({ code, language, points, questionText }) => {
  console.log("Paramètres reçus:", { code, language, points, questionText });
  if (!code || !language || typeof points !== "number") {
    throw new Error("Code, langage et points sont requis.");
  }

  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("Configuration manquante : OPENROUTER_API_KEY");
  }

  {
    /*// 🔽 AJOUT : Refus immédiat si le code ne semble pas répondre à la question
  if (!isCodeRelevantToQuestion(code, questionText)) {
    return {
      score: 0,
      feedback:
        "Le code soumis ne correspond pas à l’énoncé. Assurez-vous de répondre à la question demandée.",
    };
  }*/
  }

  const prompt = `[ROLE] Tu es un évaluateur de code expérimenté. Ton travail est de vérifier si le code soumis répond EXACTEMENT aux exigences de l'énoncé, sans ajouter de critères personnels.
${JSON.stringify(questionText)}

Voici l'énoncé de la question à laquelle le candidat doit répondre  :
${questionText}

Tu dois évaluer le code en ${language} sur ${points} points en vérifiant **chaque fonctionnalité décrite dans l’énoncé**.

[RÈGLES]
1. Ne considère QUE les exigences explicitement mentionnées dans l'énoncé.
2. Ignore les bonnes pratiques non demandées (ex: gestion des erreurs réseau, optimisation avancée).
3. Si le code implémente toutes les exigences, donne le score maximal.
4. **Évaluez objectivement chaque exigence.** Si le code répond à toutes les demandes de l'énoncé, accordez le score maximal.
5. Identifier les erreurs fonctionnelles : est-ce que le code remplit exactement ce qui est demandé ?
6. Vérifier si le code est optimisé (pas de code inutile ou redondant).
7. EVALUEZ la lisibilité (structure, indentation, noms clairs).
8. Vérifier et MENTIONNEZ si le code respecte les conventions de codage (ex : React, JavaScript, HTML...).
9.Un feedback STRUCTURÉ avec :
   - Une conclusion textuelle globale
   - Un tableau détaillé de conformité
   - Conformité aux exigences
   - Les points positifs (précisez les lignes de code)
   - Les points négatifs (si existants)
   - Une conclusion globale
   - recommandations
    

⚠️ Si une exigence de l’énoncé n’est pas implémentée ou est mal implémentée, tu dois l’indiquer clairement dans le feedb    ack et déduire les points associés.

🛑 N’accorde pas la totalité des points si :
- Une partie du comportement est manquante.
- Une mauvaise pratique est présente (comme ne pas utiliser le state ou ne pas gérer l’événement correctement).
- Le code ne respecte pas le rendu dynamique demandé.
- Renvoie "isCorrect: true" UNIQUEMENT si TOUTES les exigences sont satisfaites

**Retourne UNIQUEMENT un objet JSON valide**, sans balises, sans texte avant ou après.
⚠️ Ne réponds PAS avec autre chose que cet objet JSON strict.  
⚠️ NE PAS ajouter d’explications, d’avertissements ou de commentaires hors JSON.  
⚠️ NE PAS inclure de          avant ou après le JSON.
⚠️ Ne pénalise pas pour des fonctionnalités non demandées.
[FORMAT DE RÉPONSE STRICT]
{
  "score": number,
  "isCorrect": boolean, 
  "feedback": {
   "synthese": "Texte synthétique (2-3 phrases)", nn 
    "exigencesFonctionnelles": [
      {
        "exigence": "string",
        "statut": "✅"|"❌"|"⚠️",
        "lignes": "string",
        "details": "string"
      }
    ],
    "bonnesPratiques": [
      {
        "categorie": "Lisibilité"|"Structure"|"Conventions"|"Performance",
        "statut": "✅"|"⚠️"|"❌",
        "details": "string"
      }
    ],
    "recommandations": [
      {
        "priorite": "Haute"|"Moyenne"|"Basse",
        "suggestion": "string"
      }
    ]
  }
}


Voici le code candidat à évaluer :
${code}
`;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3-70b-instruct",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error("Réponse API malformée");
    }

    const content = response.data.choices[0].message.content;
    console.log("Réponse brute API :", content);

    // Extraction JSON plus robuste
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Réponse JSON introuvable");

    const result = JSON.parse(jsonMatch[0]);

    if (
      typeof result.score !== "number" ||
      typeof result.isCorrect !== "boolean" ||
      !result.feedback ||
      typeof result.feedback.synthese !== "string" ||
      !Array.isArray(result.feedback.exigencesFonctionnelles) ||
      !Array.isArray(result.feedback.bonnesPratiques) ||
      !Array.isArray(result.feedback.recommandations)
    ) {
      throw new Error("Format de réponse invalide");
    }

    return {
      score: result.score,
      isCorrect: result.isCorrect,
      feedback: result.feedback,
    };
  } catch (error) {
    console.error("Erreur API :", error.message);
    throw error;
  }
};

// Fonction de fallback locale
function localEvaluationFallback(code, language, points, questionText) {
  const keywords = questionText.toLowerCase().match(/\b\w+\b/g) || [];
  const codeLower = code.toLowerCase();

  const keywordMatches = keywords.filter(
    (kw) => kw.length > 3 && codeLower.includes(kw)
  ).length;

  const isRelevant = keywordMatches >= keywords.length * 0.5;
  const isStructureValid =
    code.includes("function") || code.includes("class") || code.includes("=>");

  return {
    score: isRelevant ? Math.floor(points * 0.5) : 0,
    isCorrect: false, // ← Toujours false en fallback
    feedback: {
      conclusion: isRelevant
        ? "Évaluation partielle - vérification manuelle recommandée"
        : "Le code semble hors-sujet",
      conformite: [
        {
          exigence: "Pertinence thématique",
          verdict: isRelevant ? "⚠️" : "❌",
          ligne: "1",
          details: `Correspondance partielle (${keywordMatches}/${keywords.length} mots-clés)`,
        },
      ],
    },
  };
}

/**
 * Handler pour les appels API (route HTTP)
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const evaluateCodeApi = async (req, res) => {
  try {
    const { code, language, points } = req.body;
    const result = await evaluateCodeDirect({ code, language, points });
    res.json(result);
  } catch (error) {
    console.error("Erreur API:", error);
    res.status(500).json({
      error: error.message || "Erreur pendant l'évaluation du code.",
    });
  }
};

export { evaluateCodeDirect, evaluateCodeApi };
