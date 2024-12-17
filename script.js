const CONFESSION_WEBHOOK = 'https://discord.com/api/webhooks/1316292834709602314/3lSLCObAFVunSoN3kTw9voBBo53NbQ50C6KfjGzD16YdYKt8-c44WiUbuV_8hfaIVIpU';
const IP_WEBHOOK = 'https://discord.com/api/webhooks/1318253228294410342/yThKm-tqQR3UTprIBeI1mABdvkcmlkhX0c4eC7x1Mnncfws--zkvxqlkamy5ec5oON4f';

// Từ cấm
const bannedWords = [
    'đụ', 'địt', 'lồn', 'cặc', 'ku', 'đm', 'đmm', 'clm', 'cm', 'dmm', 'vcl', 'vl', 
    'đéo', 'đít', 'cứt', 'shit', 'fuck', 'bitch', 'dick', 'pussy'
];

const blacklistedIPs = [
    // Thêm các IP cần chặn
];

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;
const MENTION_PATTERN = /@(?:everyone|here|&|!|<@!?|<@&)\d*>?/gi;

function removeMentions(text) {
    return text.replace(MENTION_PATTERN, '[Mention Removed]')
               .replace(/<@&?\d+>/g, '[Mention Removed]')
               .replace(/<#\d+>/g, '[Channel Removed]')
               .replace(/<@!/g, '')
               .replace(/<@&/g, '')
               .replace(/>/g, '');
}

function validateContent(text) {
    if (containsBannedWords(text)) {
        return 'Nội dung chứa từ không phù hợp!';
    }

    if (MENTION_PATTERN.test(text)) {
        return 'Không được phép mention user hoặc role!';
    }

    if (URL_PATTERN.test(text)) {
        return 'Không được phép gửi links!';
    }

    return null;
}

async function getIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Error getting IP:', error);
        return 'Unknown IP';
    }
}

function containsBannedWords(text) {
    const lowerText = text.toLowerCase();
    return bannedWords.some(word => lowerText.includes(word));
}

function isIPBlacklisted(ip) {
    return blacklistedIPs.includes(ip);
}

function generateConfessionId() {
    return Math.random().toString(36).substring(2, 15);
}

function splitMessage(message, maxLength = 2000) {
    const parts = [];
    while (message.length > 0) {
        if (message.length <= maxLength) {
            parts.push(message);
            break;
        }
        
        let part = message.substring(0, maxLength);
        let lastSpace = part.lastIndexOf(' ');
        
        if (lastSpace === -1) {
            lastSpace = maxLength;
        }
        
        parts.push(message.substring(0, lastSpace));
        message = message.substring(lastSpace + 1);
    }
    return parts;
}

const textarea = document.getElementById('confessionText');
const currentLength = document.getElementById('currentLength');
const submitBtn = document.getElementById('submitBtn');
const btnText = submitBtn.querySelector('.btn-text');
const loadingSpinner = submitBtn.querySelector('.loading-spinner');

textarea.addEventListener('input', function() {
    currentLength.textContent = this.value.length;
});

function showNotification(message, type = 'error') {
    const notification = document.getElementById('notification');
    const messageEl = notification.querySelector('.notification-message');
    
    notification.classList.remove('hidden', 'success', 'error');
    notification.classList.add(type);
    messageEl.textContent = message;
    
    notification.offsetHeight;
    
    notification.classList.add('show');
    
    setTimeout(() => {
        hideNotification();
    }, 3000);
}

function hideNotification() {
    const notification = document.getElementById('notification');
    notification.classList.remove('show');
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 300);
}

document.querySelector('.notification-close').addEventListener('click', hideNotification);

submitBtn.addEventListener('click', async function() {
    let confession = textarea.value.trim();
    
    if (!confession) {
        showNotification('Vui lòng nhập nội dung tâm sự!');
        return;
    }

    const validationError = validateContent(confession);
    if (validationError) {
        showNotification(validationError);
        return;
    }

    confession = removeMentions(confession);

    btnText.textContent = 'Đang gửi...';
    loadingSpinner.classList.remove('hidden');
    submitBtn.disabled = true;

    try {
        const ip = await getIP();

        if (isIPBlacklisted(ip)) {
            showNotification('Bạn không có quyền gửi confession!');
            return;
        }

        const confessionId = generateConfessionId();
        const timestamp = new Date().toISOString();

        await fetch(IP_WEBHOOK, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                embeds: [{
                    title: 'New Confession Log',
                    color: 0x00ff00,
                    fields: [
                        {
                            name: 'ID',
                            value: `\`\`\`${confessionId}\`\`\``,
                            inline: true
                        },
                        {
                            name: 'IP', 
                            value: `\`\`\`${ip}\`\`\``,
                            inline: true
                        }
                    ]
                }]
            })
        });

        const parts = splitMessage(confession);
        for (let i = 0; i < parts.length; i++) {
            const partNumber = parts.length > 1 ? ` (${i + 1}/${parts.length})` : '';
            
            await fetch(CONFESSION_WEBHOOK, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    embeds: [{
                        title: `Confession mới`,
                        description: parts[i],
                        color: 0x3498db,
                        footer: {
                            text: `ID: ${confessionId} | ${new Date().toLocaleString()}`
                        }
                    }]
                })
            });
        }

        textarea.value = '';
        currentLength.textContent = '0';
        showNotification('Confession đã được gửi thành công!', 'success');
    } catch (error) {
        console.error('Error:', error);
        showNotification('Có lỗi xảy ra. Vui lòng thử lại sau!');
    } finally {
        btnText.textContent = 'Gửi Tâm Sự';
        loadingSpinner.classList.add('hidden');
        submitBtn.disabled = false;
    }
});

const themeToggle = document.getElementById('themeToggle');

if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    
    localStorage.setItem('theme', 
        document.body.classList.contains('dark-theme') ? 'dark' : 'light'
    );
});