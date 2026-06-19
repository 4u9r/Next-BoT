const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, 
    ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder, ChannelType, PermissionsBitField, REST, Routes, MessageFlags
} = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const http = require('http');
http.createServer((req, res) => {
   res.write("Bot is running!");
   res.end();
}).listen(process.env.PORT || 3000);

const PREFIX = '-'; 
const EMOJI_PREFIX = '!'; 

const TOKEN = process.env.TOKEN; 
const CLIENT_ID = "1517124629272072232";
const GUILD_ID = "1515006381357531236";

const BUTTON_ROOM_ID = '1515024935603671071';   
const FEEDBACK_ROOM_ID = '1515021789313368086'; 
const LOG_CHANNEL_ID = "1516124616412893226";   
const AFK_VC_ID = "1515731516175417354";        

const TICKET_CATEGORY_ID = "1515024664328536155"; 

const CUSTOM_EMOJI = '1516146900284211210'; 
const BUTTON_EMOJI = '1515707612048654426';     

const THUMB_URL = 'https://cdn.discordapp.com/attachments/1466089525934821448/1516252811535585329/0180FB26-A022-46EC-951F-E975A9FE5A59.png?ex=6a31f7f8&is=6a30a678&hm=3bcc3bfc7774cf220ca01639a7f57bf8d5f9e9e8088178b2d84c0f581437a073&';
const LINE_URL = 'https://cdn.discordapp.com/attachments/1515778753438158898/1515779126081093704/885794064438538240.png'; 
const TICKET_IMAGE_URL = "https://cdn.discordapp.com/attachments/1467179460930572483/1516104127996891316/0180FB26-A022-46EC-951F-E975A9FE5A59.png";

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

const createFeedbackButtonRow = () => {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('open_feedback_modal')
            .setLabel('رأيك')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(BUTTON_EMOJI)
    );
};

async function createTranscript(channel) {
    let messages = [];
    let lastId;

    while (true) {
      const fetched = await channel.messages.fetch({ limit: 100, before: lastId }).catch(() => null);
      if (!fetched || fetched.size === 0) break;

      messages.push(...fetched.values());
      lastId = fetched.last().id;
    }

    messages = messages.reverse();
    let text = `Transcript - ${channel.name}\n\n`;

    for (const msg of messages) {
      text += `[${msg.author.tag}] : ${msg.content || "[embed/attachment]"}\n`;
    }

    return text;
}

async function sendLog(guild, embed, file) {
    const channel = guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!channel) return;

    if (file) {
      return channel.send({ embeds: [embed], files: [file] }).catch(() => null);
    }
    channel.send({ embeds: [embed] }).catch(() => null);
}

client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}!`);
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            {
                body: [
                    {
                        name: 'ticket',
                        description: 'فتح التذاكر الخاص بالمتجر'
                    }
                ]
            }
        );
    } catch (error) {
        console.error("Error refreshing slash commands:", error);
    }
});

client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isChatInputCommand() && interaction.commandName === 'ticket') {
            const embed = new EmbedBuilder().setColor('Purple').setDescription(`\n\n**ᴺˢ〢طلب منتج**\n**📍 الرجاء اضغط على الخيار في الاسفل**\n\n`).setImage(TICKET_IMAGE_URL);
            const menu = new StringSelectMenuBuilder().setCustomId('ticket_select').setPlaceholder('اختر نوع التكت').addOptions(
                new StringSelectMenuOptionBuilder().setLabel('طلب منتجᴺˢ〢').setValue('product').setEmoji('<:marar:1515720408337354852>'),
                new StringSelectMenuOptionBuilder().setLabel('الدعم الفنيᴺˢ〢').setValue('support').setEmoji('<:marar:1515854026657501315>')
            );
            return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
        }
        if (interaction.isButton()) {
            if (interaction.customId === 'open_feedback_modal') {
                const modal = new ModalBuilder().setCustomId('feedback_modal_submit').setTitle('تقييم الخدمات والآراء');
                modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('feedback_text_input').setLabel('اكتب رأيك أو تقييمك هنا:').setStyle(TextInputStyle.Paragraph).setRequired(true)));
                return await interaction.showModal(modal);
            }
            if (interaction.customId === 'rules_store') {
                return interaction.reply({ content: `**__~ قوانين Next Shop ~...__**`, flags: [MessageFlags.Ephemeral] });
            }
            if (interaction.customId === 'rules_server') {
                return interaction.reply({ content: `**__قوانين وشروط المتجر...__**`, flags: [MessageFlags.Ephemeral] });
            }
            if (interaction.customId === 'close_ticket') {
                const transcript = await createTranscript(interaction.channel);
                await sendLog(interaction.guild, new EmbedBuilder().setColor('Red').setTitle('**🔒اغلاق التكت**'), { attachment: Buffer.from(transcript, 'utf8'), name: `transcript.txt` });
                interaction.reply({ content: '**__سيتم اغلاق التكت بعد 4 ثواني...__**' });
                setTimeout(() => interaction.channel.delete().catch(() => {}), 4000);
            }
        }
        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
            const channel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`, type: ChannelType.GuildText, parent: TICKET_CATEGORY_ID,
                permissionOverwrites: [{ id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }, { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }]
            });
            await channel.send({ content: `${interaction.user} يرجى كتابة التفاصيل <@&1515031089406546041>`, components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('close_ticket').setLabel('Close').setEmoji('🔒').setStyle(ButtonStyle.Secondary))] });
            return interaction.editReply({ content: `تم فتح التكت: ${channel}` });
        }
        if (interaction.isModalSubmit() && interaction.customId === 'feedback_modal_submit') {
            const feedbackChannel = interaction.guild.channels.cache.get(FEEDBACK_ROOM_ID);
            await feedbackChannel.send({ embeds: [new EmbedBuilder().setColor('#8a2be2').setDescription(`**الرأي:**\n${interaction.fields.getTextInputValue('feedback_text_input')}`)] });
            await feedbackChannel.send({ content: LINE_URL, components: [createFeedbackButtonRow()] });
            await interaction.reply({ content: '**✅ تم إرسال التقييم!**', flags: [MessageFlags.Ephemeral] });
        }
    } catch (err) { console.error(err); }
});
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // الميزة التي طلبتها: تشغيل الخط عند إرسال "-"
    if (message.content === "-") {
        try {
            await message.delete().catch(() => {});
            return message.channel.send({ content: LINE_URL });
        } catch (err) {
            console.error(err);
        }
    }

    // 🌟 1. أمر إرسال ايموجيات السيرفر (بالبادئة !)
    if (message.content.startsWith(EMOJI_PREFIX)) {
        const args = message.content.slice(EMOJI_PREFIX.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'ايموجي') {
            const emojis = message.guild.emojis.cache;
            if (emojis.size === 0) {
                return message.reply('❌ هذا السيرفر لا يحتوي على أي إيموجيات مخصصة.');
            }

            await message.channel.send(`⏳ جاري إرسال عدد (${emojis.size}) إيموجي حبة حبة...`);

            for (const [id, emoji] of emojis) {
                try {
                    await message.channel.send(`${emoji}`);
                    await new Promise(resolve => setTimeout(resolve, 1000)); 
                } catch (error) {
                    console.error(`[ERROR] فشل إرسال الإيموجي: ${emoji.name}`);
                }
            }
            return message.channel.send('✅ تم إرسال جميع إيموجيات السيرفر بنجاح!');
        }
    }

    // لجميع الأوامر الأخرى التي تستخدم البادئة (-)
    if (!message.content.startsWith(PREFIX)) return;
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    // 📣 أمر -رسالة
    if (cmd === 'رسالة') {
        const textToSend = args.join(' ');
        if (!textToSend) return message.reply("**❌ يرجى كتابة الرسالة التي تريد إرسالها**").then(m => setTimeout(() => m.delete(), 5000));
        await message.delete().catch(() => {});
        return message.channel.send({ content: textToSend });
    }

    // 📣 أمر -say
    if (cmd === 'say') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.reply("❌ ليس لديك صلاحية استخدام هذا الأمر").catch(() => null);
        }

        const sayMessage = args.join(' ');
        if (!sayMessage) return message.reply("**❌ يرجى كتابة النص **").catch(() => null);

        try {
            await message.delete().catch(() => {});
            const sayEmbed = new EmbedBuilder().setColor('#8a2be2').setDescription(sayMessage); 
            return message.channel.send({ embeds: [sayEmbed] });
        } catch (err) {
            console.error("Error running -say command:", err);
        }
    }

    // 🛠️ أمر -ارسل
    if (cmd === 'ارسل') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ ليس لديك صلاحية استخدام هذا الأمر.').then(msg => {
                setTimeout(() => msg.delete(), 5000);
            });
        }

        const buttonChannel = message.guild.channels.cache.get(BUTTON_ROOM_ID);
        if (!buttonChannel) {
            return message.reply('❌ لم يتم العثور على روم إرسال الزر، تأكد من الـ ID.');
        }

        const feedbackEmbed = new EmbedBuilder()
            .setColor('#8a2be2')
            .setTitle('** رأيك يهمنـا **')
            .setDescription('\n')
            .setThumbnail(THUMB_URL)
            .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
            .setTimestamp();

        await buttonChannel.send({ embeds: [feedbackEmbed], components: [createFeedbackButtonRow()] });
        await message.reply(`✅ تم إرسال رسالة التقييم الأساسية بنجاح إلى الروم: <#${BUTTON_ROOM_ID}>`);
        return message.delete().catch(() => {});
    }

    // ℹ️ أمر المساعدة -help
    if (cmd === "help" || cmd === "hlep") {
        const helpMessage = 
          `**__ امر -say = امبيد ب الرساله الي انت تبيه\n\n` +
          `-رسالة [النص] = إرسال رسالة عن طريق البوت مباشرة\n\n` +
          `-قوانين لـ عرض قوانين NEXT ~ ShOP\n\n` +
          `-أفتارات لـ عرض التفاصيل أسعار و كذا \n\n` +
          `-نداء [ منشن الشخص ]\n\n` +
          `-روم يدخل البوت روم AfK\n\n` +
          `-علامه تشغيل الحالة البنفسجية لـ البوت \n\n` +
          `خط/- معروف ما يحتاج \n\n` +
          `امر التكت بالسلاش\n\n` +
          `/ticket يرسل امر فتح التكت \n\n` +
          `لـ عرض قائمة الأوامر -hlep\n\n` +
          `From NEXT ~ ShOP \n__**`;
        return message.reply({ content: helpMessage }).catch(() => null);
    }

    // 📝 أمر قوانين
    if (cmd === "قوانين") {
        const rulesEmbed = new EmbedBuilder().setColor('Red').setTitle('server').setDescription(`**قوانين و السياسات التابعة لي سيرفر**\n\n`);
        const storeButton = new ButtonBuilder().setCustomId('rules_store').setLabel('قوانين المتجر').setStyle(ButtonStyle.Danger);
        const serverButton = new ButtonBuilder().setCustomId('rules_server').setLabel('سياسات المتجر').setStyle(ButtonStyle.Danger);
        const row = new ActionRowBuilder().addComponents(storeButton, serverButton);
        return message.reply({ embeds: [rulesEmbed], components: [row] }).catch(() => null);
    }

    // 🖼️ أمر افتارات
    if (cmd === "أفتارات" || cmd === "افتارات") {
        const avatarEmbed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('Next Shop')
          .setDescription(`**__أفتار واحد :⃁ 1__**\n\n**__غلاف :⃁ 5__**\n\n**__طريقة :⃁ 15__**\n\n`);
        return message.reply({ embeds: [avatarEmbed] }).catch(() => null);
    }

    // 🖼️ أمر الخط
    if (cmd === "خط") {
        try {
          await message.delete().catch(() => {});
          return message.channel.send({ content: LINE_URL });
        } catch (err) { console.error(err); }
    }

    // 🟣 أمر العلامة
    if (cmd === "علامه") {
        client.user.setPresence({
          activities: [{ name: "Next Shop", type: 1, url: "https://twitch.tv/example" }],
          status: "online"
        });
        return message.reply("**✅ تم تشغيل الحالة البنفسجية بنجاح!**").catch(() => null);
    }

    // 📢 أمر نداء
    if (cmd === "نداء") {
        const member = message.mentions.members.first();
        if (!member) return message.reply("**منشن الشخص أولاً**").catch(() => null);
        const urlButton = new ButtonBuilder().setLabel('الانتقال إلى الرسالة').setStyle(ButtonStyle.Link).setURL(`https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`);
        const row = new ActionRowBuilder().addComponents(urlButton);
        try {
          await member.send({ content: `${member}\n**__تم ندائك بواسطة : ${message.author}__**`, components: [row] });
          return message.reply("**✅ تم إرسال النداء بنجاح **").catch(() => null);
        } catch (err) {
          return message.reply("❌ لا يمكنني إرسال رسالة لهذا العضو (خاص مقفل)").catch(() => null);
        }
    }

    // 🛠️ أمر روم AFK
    if (cmd === "روم") {
        const channel = message.guild.channels.cache.get(AFK_VC_ID);
        if (!channel || channel.type !== ChannelType.GuildVoice) return message.reply("❌ الروم الصوتي غير موجود").catch(() => null);
        try {
            joinVoiceChannel({
                channelId: channel.id, guildId: message.guild.id, adapterCreator: message.guild.voiceAdapterCreator,
                selfDeaf: true, selfMute: true
            });
            return message.reply("**🎧 تم دخول الروم الصوتي بنجاح Next Top**").catch(() => null);
        } catch (err) { return message.reply("❌ واجهت مشكلة في دخول الروم الصوتي").catch(() => null); }
    }
});

client.login(process.env.TOKEN);
