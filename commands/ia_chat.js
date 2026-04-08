const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialisation
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

let chatAiActive = false; 
const pendingReplies = new Map();

async function iaAutoChat(sock, chatId, message, msgText) {
    // 1. Activation/Désactivation (Commandes)
    if (msgText === '.chat on') {
        chatAiActive = true;
        await sock.sendMessage(chatId, { text: "🤖 *Mode IA activé !*" });
        return;
    }
    if (msgText === '.chat off') {
        chatAiActive = false;
        await sock.sendMessage(chatId, { text: "👤 *Mode IA désactivé.*" });
        return;
    }

    // 2. Réponse automatique
    // Note : Cette partie risque de ne fonctionner que si ton bot 
    // envoie TOUS les messages vers ce fichier.
    if (chatAiActive && !message.key.fromMe && !chatId.endsWith('@g.us')) {
        if (pendingReplies.has(chatId)) clearTimeout(pendingReplies.get(chatId));

        const timer = setTimeout(async () => {
            try {
                await sock.sendPresenceUpdate('composing', chatId);
                const result = await model.generateContent(`Réponds brièvement : ${msgText}`);
                const response = await result.response;
                await sock.sendMessage(chatId, { text: "🤖 " + response.text() });
                pendingReplies.delete(chatId);
            } catch (e) { console.error(e); }
        }, 60000);

        pendingReplies.set(chatId, timer);
    }
}

module.exports = iaAutoChat; // On l'exporte comme ta commande .ban
