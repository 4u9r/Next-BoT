const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ChannelType,
    PermissionsBitField,
    REST,
    Routes
} = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

// إنشاء عميل البوت وتحديد الـ Intents المطلوبة بالكامل
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// ================== إضافة بورت وهمي لمنصة RENDER ==================
const http = require('http');
http.createServer((req, res) => {
   res.write("Bot is running!");
   res.end();
}).listen(process.env.PORT || 3000);
// =================================================================

// ================== CONFIG (الإعدادات الخاصة بك) ==================
const PREFIX = '-'; 
const EMOJI_PREFIX = '!'; // بادئة أمر الايموجي

const TOKEN = process.env.TOKEN; // توكن البوت الأساسي
const CLIENT_ID = "1517124629272072232";
const GUILD_ID = "1515006381357531236";

const BUTTON_ROOM_ID = '1515024935603671071';   // روم زر الرسالة الأساسية للتقييم
const FEEDBACK_ROOM_ID = '1515021789313368086'; // روم التقييمات والخط والزر المتكرر
const LOG_CHANNEL_ID = "1516124616412893226";   // روم اللوج للتكت
const AFK_VC_ID = "1515731516175417354";        // ايدي روم الـ AFK الصوتي

// 📩 تم ربط إيدي الكاتلوج المخصص للتكت هنا لفتحه تلقائياً بداخله
const TICKET_CATEGORY_ID = "1515024664328536155"; 

const CUSTOM_EMOJI = '1517340320906346607';     // ايدي الإيموجي المتحرك التلقائي على رسالة العميل
const BUTTON_EMOJI = '1515707612048654426';     // ايدي إيموجي زر رأيك الجديد

// روابط الصور المخصصة والنظيفة
const THUMB_URL = 'https://cdn.discordapp.com/attachments/1466089525934821448/1516252811535585329/0180FB26-A022-46EC-951F-E975A9FE5A59.png?ex=6a31f7f8&is=6a30a678&hm=3bcc3bfc7774cf220ca01639a7f57bf8d5f9e9e8088178b2d84c0f581437a073&';
const LINE_URL = 'https://cdn.discordapp.com/attachments/1515778753438158898/1515779126081093704/885794064438538240.png'; 
const TICKET_IMAGE_URL = "https://cdn.discordapp.com/attachments/1467179460930572483/1516104127996891316/0180FB26-A022-46EC-951F-E975A9FE5A59.png";

// ================== ERRORS PREVENTION ==================
process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

// إنشاء صف المكونات (الزر) لإعادة استخدامه بسهولة في الرومين للتقييم
const createFeedbackButtonRow = () => {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('open_feedback_modal')
            .setLabel('رأيك')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(BUTTON_EMOJI)
    );
};

// ================== TRANSCRIPT FUNCTION ==================
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

// ================== LOG FUNCTION ==================
async function sendLog(guild, embed, file) {
    const channel = guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!channel) return;

    if (file) {
      return channel.send({ embeds: [embed], files: [file] }).catch(() => null);
    }
    channel.send({ embeds: [embed] }).catch(() => null);
}

// ================== READY EVENT ==================
client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}!`);
    console.log(`✅ تم تشغيل البوت بنجاح ومدمج به كل الخصائص.`);

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
        console.log("Successfully reloaded /ticket slash command.");
    } catch (error) {
        console.error("Error refreshing slash commands:", error);
    }
});

// ================== INTERACTION CREATE (BUTTONS, MODALS, SELECT MENUS) ==================
client.on('interactionCreate', async (interaction) => {
    try {
        // 1. Slash Command [/ticket]
        if (interaction.isChatInputCommand() && interaction.commandName === 'ticket') {
            const embed = new EmbedBuilder()
                .setColor('Purple')
                .setDescription(
                    `\n\n` +
                    `**ᴺˢ〢طلب منتج**\n` +
                    `**📍 الرجاء اضغط على الخيار في الاسفل**\n\n`
                )
                .setImage(TICKET_IMAGE_URL);

            const menu = new StringSelectMenuBuilder()
                .setCustomId('ticket_select')
                .setPlaceholder('اختر نوع التكت')
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('طلب منتجᴺˢ〢')
                        .setValue('product')
                        .setEmoji('<:marar:1515720408337354852>'),

                    new StringSelectMenuOptionBuilder()
                        .setLabel('الدعم الفنيᴺˢ〢')
                        .setValue('support')
                        .setEmoji('<:marar:1515854026657501315>')
                );

            const row = new ActionRowBuilder().addComponents(menu);
            return interaction.reply({ embeds: [embed], components: [row] });
        }

        // 2. Button Interaction
        if (interaction.isButton()) {
            // فتح نافذة التقييم المنبثقة (Modal)
            if (interaction.customId === 'open_feedback_modal') {
                const modal = new ModalBuilder()
                    .setCustomId('feedback_modal_submit')
                    .setTitle('تقييم الخدمات والآراء');

                const feedbackInput = new TextInputBuilder()
                    .setCustomId('feedback_text_input')
                    .setLabel('اكتب رأيك أو تقييمك هنا:')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('مثال: خدمة ممتازة وسريعة،')
                    .setRequired(true)
                    .setMinLength(1) 
                    .setMaxLength(1000);

                const firstActionRow = new ActionRowBuilder().addComponents(feedbackInput);
                modal.addComponents(firstActionRow);
                return await interaction.showModal(modal);
            }

            // أزرار قوانين وسياسات المتجر
            if (interaction.customId === 'rules_store') {
                const textStore = `**__~ قوانين Next Shop ~\n\n` +
                    `يمنع منعا باتا الشتم و قله الادب في الشات العام\n\n` +
                    `يمنع المنشن بالتكت اكثر من ثلاث مرات قد يععرضك الفعل هذا الى اقفال تكت مباشرة .\n\n` +
                    `يمنع منعا باتا انتهاك حقوق السيرفر ب اي شكل من الاشكال .\n\n` +
                    `يمنع منعا باتا النشر و التشهير in الاشخاص .\n\n` +
                    `يمنع منعا باتا طلب ترجيع مبلغ في حال تم دفع ولكن يتم استرجاع المبلغ في الحالات الخاصه مثل عدم تنفيذ الطلب والخ فقط .\n\n\n` +
                    `ملاحظه مهمه تنفيذ طلبك في اقل من 24h اذا لايوجد ضغط علينا بشكل كبير .  \n\n` +
                    `From : Next Shop .\n__**`;
                return interaction.reply({ content: textStore, flags: [4] });
            }

            if (interaction.customId === 'rules_server') {
                const textServer = `**__قوانين وشروط المتجر \n\n` +
                    `1. إتمام عملية الشراء يعني موافقة العميل على جميع القوانين والشروط المذكورة in هذا القسم.\n` +
                    `2. جميع المنتجات والخدمات القدمة رقمية، لذلك لا يمكن استرجاع أو استبدال المبلغ بعد إتمام عملية الدفع.\n` +
                    `3. يجب على العميل التأكد من اختيار المنتج الصحيح قبل الدفع.\n` +
                    `4. أي محاولة للاحتيال تعرض صاحبها للحرمان من خدمات المتجر بشكل دائم.\n` +
                    `5. يحق لإدارة المتجر تعديل أو تحديث القوانين في أي وقت.\n` +
                    `6. يمنع منعًا باتًا إعادة بيع أو نشر أو مشاركة أي منتج تم شراؤه.\n` +
                    `7. يتم تنفيذ الطلبات خلال المدة المحددة لكل منتج.\n` +
                    `8. أي إساءة لفظية تجاه فريق العمل تؤدي إلى إيقاف الخدمة دون سابق إنذار.\n` +
                    `9. المتجر غير مسؤول عن أي استخدام خاطئ للمنتجات بعد تسليمها.\n` +
                    `10. في حال حدوث مشكلة تقنية من طرف المتجر، سيتم تقديم الحل المناسب.\n` +
                    `11. يتم تسليم المنتج بعد التأكد من وصول المبلغ كاملًا.\n` +
                    `12. الحفاظ على سرية بيانات الحسابات مسؤولية شخصية تقع على عاتق العميل نفسه.__**`;
                return interaction.reply({ content: textServer, flags: [4] });
            }

            // إغلاق التكت
            if (interaction.customId === 'close_ticket') {
                const user = interaction.user;
                await interaction.reply({ content: '**__سيتم اغلاق التكت بعد 5 ثواني ...<a:FG:1472545932234068068>__**' });

                const transcript = await createTranscript(interaction.channel);

                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('**🔒اغلاق التكت**')
                    .setDescription(`**تم الإغلاق بواسطة: ${user}**`)
                    .addFields({ name: 'الروم', value: `${interaction.channel.name}` });

                const file = {
                    attachment: Buffer.from(transcript, 'utf8'),
                    name: `transcript-${interaction.channel.name}.txt`
                };

                await sendLog(interaction.guild, embed, file);

                setTimeout(() => {
                    interaction.channel.delete().catch(() => {});
                }, 4000);
            }
        }

        // 3. String Select Menu (إنشاء التكت تحت الكاتلوج المحددة مباشرة)
        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
            const user = interaction.user;
            await interaction.deferReply({ flags: [4] });

            const channel = await interaction.guild.channels.create({
                name: `ticket-${user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                type: ChannelType.GuildText,
                parent: TICKET_CATEGORY_ID, // 👈 تم ربط المتغير البرمجي لفتح التكت داخل الكاتلوج المحددة
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: user.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages
                        ]
                    }
                ]
            });

            // تعديل النص ولون الشريط والـ Footer ليطابق Ticket Tool بالظبط كالصورة
            const embed = new EmbedBuilder()
                .setColor('#2ecc71') // اللون الأخضر الفاتح المطابق تماماً للصورة
                .setDescription(
                    `**__تم فتح التكت ، قل ما عندك وإنتظر الإدارة .\n\n` +
                    `قوانين التكت :\n` +
                    `يُمنع منشن الإداريين إلا في حال عدم تجاوب لمدة 5 دقائق.\n` +
                    `يُمنع فتح تكت للإستهبال أو عدم الجدية،\n` +
                    `يجيب إحترام الإدارة داخل التكت .\n` +
                    `فور فتحك للتكت يُرجى قول ما عندك وبعدها إنتظار إداري .__**`
                )
                .setFooter({ 
                    text: 'TicketTool.xyz - Ticketing without clutter', 
                    iconURL: 'https://cdn.discordapp.com/emojis/1472545690877169748.png' 
                });

            // زر الإغلاق السادة والرمادي نفس الصورة
            const button = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Close')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(button);

            // إرسال النص الخارجي والمنشن العلوي والمنشن الخاص برتبة المنيجمنت المطابق للصورة تماماً
            await channel.send({
                content: `${user} . يرجى منك كتابة جميع التفاصيل المتعلقة بطلبك بشكل واضح، وسيتم التعامل مع طلبك من قبل الادارة\n<@&1515031089406546041>`,
                embeds: [embed],
                components: [row]
            });

            return interaction.editReply({ content: `تم فتح التكت بنجاح: ${channel}` });
        }

        // 4. Modal Submit Handler (حفظ التقييم وإرساله)
        if (interaction.isModalSubmit() && interaction.customId === 'feedback_modal_submit') {
            const userFeedback = interaction.fields.getTextInputValue('feedback_text_input');
            const feedbackChannel = interaction.guild.channels.cache.get(FEEDBACK_ROOM_ID);

            if (!feedbackChannel) {
                return interaction.reply({ 
                    content: '❌ خطأ: لم يتم العثور على الروم المخصص للآراء، يرجى مراجعة الإدارة.', 
                    flags: [4] 
                });
            }

            const resultEmbed = new EmbedBuilder()
                .setColor('#8a2be2') 
                .setAuthor({ 
                    name: interaction.user.tag, 
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }) 
                })
                .setDescription(`\n**العميل :** <@${interaction.user.id}>\n\n**الرأي:**\n${userFeedback}`)
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `إيدي العميل: ${interaction.user.id}` })
                .setTimestamp();

            const embedMessage = await feedbackChannel.send({ embeds: [resultEmbed] });

            await embedMessage.react(CUSTOM_EMOJI).catch(() => {
                console.log("تعذر وضع الإيموجي التلقائي المخصص.");
            });

            await feedbackChannel.send({ 
                content: LINE_URL, 
                components: [createFeedbackButtonRow()] 
            });

            await interaction.reply({ 
                content: '**__✅ تم إرسال تقييمك بنجاح! .__**', 
                flags: [4] 
            });
        }

    } catch (err) {
        console.error("INTERACTION ERROR:", err);
    }
});

// ================== TEXT MESSAGE COMMANDS ==================
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

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

    // 📣 أمر -رسالة (جديد)
    if (cmd === 'رسالة') {
        const textToSend = args.join(' ');
        if (!textToSend) return message.reply("**❌ يرجى كتابة الرسالة التي تريد إرسالها**").then(m => setTimeout(() => m.delete(), 5000));
        await message.delete().catch(() => {});
        return message.channel.send({ content: textToSend });
    }

    // 📣 أمر -say (موجود وشغال بالكامل باللون البنفسجي)
    if (cmd === 'say') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.reply("❌ ليس لديك صلاحية استخدام هذا الأمر").catch(() => null);
        }

        const sayMessage = args.join(' ');
        if (!sayMessage) return message.reply("**❌ يرجى كتابة النص **").catch(() => null);

        try {
            await message.delete().catch(() => {});

            const sayEmbed = new EmbedBuilder()
                .setColor('#8a2be2') 
                .setDescription(sayMessage); 

            return message.channel.send({ embeds: [sayEmbed] });
        } catch (err) {
            console.error("Error running -say command:", err);
        }
    }

    // 🛠️ أمر -ارسل (موجود وشغال بالكامل لإرسال لوحة رأيك الأساسية)
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
        const rulesEmbed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('server')
          .setDescription(
            `**قوانين و السياسات التابعة لي سيرفر**\n\n` +
            `نرحب بكم في متجرنا ، ونأمل من الجميع قراءة القوانين التالية والالتزام بها لضمان تجربة آمنة ومنظمة للجميع:`
          );

        const storeButton = new ButtonBuilder()
          .setCustomId('rules_store')
          .setLabel('قوانين المتجر')
          .setStyle(ButtonStyle.Danger);

        const serverButton = new ButtonBuilder()
          .setCustomId('rules_server')
          .setLabel('سياسات المتجر')
          .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(storeButton, serverButton);
        return message.reply({ embeds: [rulesEmbed], components: [row] }).catch(() => null);
    }

    // 🖼️ أمر افتارات
    if (cmd === "أفتارات" || cmd === "افتارات") {
        const avatarEmbed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('Next Shop')
          .setDescription(
            `**__أفتار واحد :⃁ 1__**\n\n` +
            `**__غلاف :⃁ 5__**\n\n` +
            `**__طريقة :⃁ 15__**\n\n` +
            `**__في حال أردت ان تشتري قم ب اختيار الافتار الذي يطابق ريجن الحساب و ثم قم بفتح تذكره <#No Access>__**\n\n` +
            `https://psprices.com/region-sa/collection/avatars?platform=PS3`
          );

        return message.reply({ embeds: [avatarEmbed] }).catch(() => null);
    }

    // 🖼️ أمر الخط التلقائي
    if (cmd === "خط") {
        try {
          await message.delete().catch(() => {});
          return message.channel.send({ content: LINE_URL });
        } catch (err) {
          console.error(err);
        }
    }

    // 🟣 أمر العلامة (الحالة البنفسجية)
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

        const urlButton = new ButtonBuilder()
          .setLabel('الانتقال إلى الرسالة')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`);

        const row = new ActionRowBuilder().addComponents(urlButton);
        const messageContent = `**__تم ندائك بواسطة : ${message.author} \nالسيرفر : ${message.guild.name}__**`;

        try {
          await member.send({ content: `${member}\n${messageContent}`, components: [row] });
          return message.reply("**✅ تم إرسال النداء بنجاح  **").catch(() => null);
        } catch (err) {
          return message.reply("❌ لا يمكنني إرسال رسالة لهذا العضو (خاص مقفل)").catch(() => null);
        }
    }

    // 🛠️ أمر روم AFK الصوتي المحدث ليوافق الصلاحيات المطلوبة
    if (cmd === "روم") {
        const channel = message.guild.channels.cache.get(AFK_VC_ID);

        if (!channel || channel.type !== ChannelType.GuildVoice) {
            return message.reply("❌ الروم الصوتي غير موجود أو غير صحيح، يرجى مراجعة الـ ID").catch(() => null);
        }

        try {
            joinVoiceChannel({
                channelId: channel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
                selfDeaf: true,
                selfMute: true
            });

            return message.reply("**🎧 تم دخول الروم الصوتي بنجاح Next Top**").catch(() => null);

        } catch (err) {
            console.error("Voice join error:", err);
            return message.reply("❌ واجهت مشكلة في دخول الروم الصوتي، تأكد من صلاحيات البوت").catch(() => null);
        }
    }
});

// ميزة تشغيل الخط التلقائي بحالة إرسال علامة "-" منفصلة
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content === "-") {
        try {
            await message.delete().catch(() => {});
            return message.channel.send({ content: LINE_URL });
        } catch (err) {
            console.error(err);
        }
    }
});

// تشغيل البوت باستخدام التوكن الأساسي الخاص بك دون تعديل
client.login(process.env.TOKEN);