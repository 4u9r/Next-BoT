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
    Routes,
    MessageFlags
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


// ================== RENDER KEEP ALIVE ==================

const http = require('http');

http.createServer((req, res) => {
    res.write("Bot is running!");
    res.end();
}).listen(process.env.PORT || 3000);


// ================== CONFIG ==================

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


// تم تعديل الإيموجيات
const CUSTOM_EMOJI = '<:emoji:1516146900284211210>';
const BUTTON_EMOJI = '<:emoji:1515707612048654426>';


// الصور

const THUMB_URL = 
'https://cdn.discordapp.com/attachments/1466089525934821448/1516252811535585329/0180FB26-A022-46EC-951F-E975A9FE5A59.png';

const LINE_URL =
'https://cdn.discordapp.com/attachments/1515778753438158898/1515779126081093704/885794064438538240.png';

const TICKET_IMAGE_URL =
"https://cdn.discordapp.com/attachments/1467179460930572483/1516104127996891316/0180FB26-A022-46EC-951F-E975A9FE5A59.png";


// ================== ERRORS ==================

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);


// ================== BUTTON ==================

const createFeedbackButtonRow = () => {

    return new ActionRowBuilder()
    .addComponents(

        new ButtonBuilder()
        .setCustomId('open_feedback_modal')
        .setLabel('رأيك')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(BUTTON_EMOJI)

    );

};



// ================== TRANSCRIPT ==================

async function createTranscript(channel){

    let messages = [];
    let lastId;

    while(true){

        const fetched = await channel.messages.fetch({
            limit:100,
            before:lastId
        }).catch(()=>null);


        if(!fetched || fetched.size === 0)
        break;


        messages.push(...fetched.values());

        lastId = fetched.last().id;

    }


    messages.reverse();


    let text = `Transcript - ${channel.name}\n\n`;


    for(const msg of messages){

        text += 
        `[${msg.author.tag}] : ${msg.content || "[embed]"}\n`;

    }


    return text;

}



// ================== LOG ==================

async function sendLog(guild,embed,file){

    const channel = guild.channels.cache.get(LOG_CHANNEL_ID);

    if(!channel) return;


    if(file){

        return channel.send({
            embeds:[embed],
            files:[file]
        }).catch(()=>null);

    }


    channel.send({
        embeds:[embed]
    }).catch(()=>null);

}
// ================== READY EVENT ==================

client.once('ready', async () => {

    console.log(`✅ Logged in as ${client.user.tag}!`);
    console.log(`✅ تم تشغيل البوت بنجاح.`);


    const rest = new REST({version:'10'})
    .setToken(TOKEN);


    try {

        await rest.put(

            Routes.applicationGuildCommands(
                CLIENT_ID,
                GUILD_ID
            ),

            {

                body:[

                    {
                        name:'ticket',
                        description:'فتح التذاكر الخاص بالمتجر'
                    }

                ]

            }

        );


        console.log("✅ تم تحديث أمر /ticket");

    } catch(error){

        console.error(
            "Slash Command Error:",
            error
        );

    }

});



// ================== INTERACTIONS ==================

client.on('interactionCreate', async (interaction)=>{


try{


// ================== SLASH TICKET ==================

if(
interaction.isChatInputCommand() &&
interaction.commandName === 'ticket'
){


const embed = new EmbedBuilder()

.setColor('Purple')

.setDescription(
`
**ᴺˢ〢طلب منتج**

**📍 الرجاء اختيار نوع التكت من الأسفل**
`

)

.setImage(TICKET_IMAGE_URL);



const menu =
new StringSelectMenuBuilder()

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



const row =
new ActionRowBuilder()
.addComponents(menu);



return interaction.reply({

embeds:[embed],

components:[row]

});


}



// ================== BUTTONS ==================

if(interaction.isButton()){



// تقييم

if(
interaction.customId === 'open_feedback_modal'
){


const modal =
new ModalBuilder()

.setCustomId('feedback_modal_submit')

.setTitle('تقييم الخدمات والآراء');



const input =
new TextInputBuilder()

.setCustomId('feedback_text_input')

.setLabel('اكتب رأيك أو تقييمك هنا:')

.setStyle(TextInputStyle.Paragraph)

.setRequired(true)

.setMinLength(1)

.setMaxLength(1000);



modal.addComponents(

new ActionRowBuilder()
.addComponents(input)

);



return interaction.showModal(modal);


}




// إغلاق التكت

if(
interaction.customId === 'close_ticket'
){


await interaction.reply({

content:
'**__سيتم اغلاق التكت بعد 5 ثواني ... 🔒__**'

});



const transcript =
await createTranscript(interaction.channel);



const embed =
new EmbedBuilder()

.setColor('Red')

.setTitle('🔒 إغلاق التكت')

.setDescription(
`تم الإغلاق بواسطة: ${interaction.user}`
)

.addFields({

name:'الروم',

value:interaction.channel.name

});



const file = {

attachment:
Buffer.from(transcript,'utf8'),

name:
`transcript-${interaction.channel.name}.txt`

};



await sendLog(
interaction.guild,
embed,
file
);



setTimeout(()=>{

interaction.channel.delete()
.catch(()=>{});

},4000);



}


}




// ================== CREATE TICKET ==================

if(

interaction.isStringSelectMenu()

&&

interaction.customId === 'ticket_select'

){


const user = interaction.user;


await interaction.deferReply({

flags:[MessageFlags.Ephemeral]

});



const channel =
await interaction.guild.channels.create({


name:
`ticket-${user.username}`.toLowerCase()
.replace(/[^a-z0-9-]/g,''),


type:
ChannelType.GuildText,


parent:
TICKET_CATEGORY_ID,



permissionOverwrites:[



{

id:
interaction.guild.id,

deny:[
PermissionsBitField.Flags.ViewChannel
]

},



{

id:user.id,

allow:[

PermissionsBitField.Flags.ViewChannel,

PermissionsBitField.Flags.SendMessages,

PermissionsBitField.Flags.ReadMessageHistory

]

}



]


});



const embed =
new EmbedBuilder()

.setColor('#2ecc71')

.setDescription(

`
**__تم فتح التكت، قل ما عندك وانتظر الإدارة.

قوانين التكت:

يمنع منشن الإداريين إلا بعد 5 دقائق.

يمنع فتح تكت بدون سبب.

احترام الإدارة مطلوب.__**
`

);



const button =
new ButtonBuilder()

.setCustomId('close_ticket')

.setLabel('Close')

.setEmoji('🔒')

.setStyle(ButtonStyle.Secondary);



const row =
new ActionRowBuilder()
.addComponents(button);



await channel.send({

content:

`${user} يرجى كتابة تفاصيل طلبك\n<@&1515031089406546041>`,

embeds:[embed],

components:[row]

});



return interaction.editReply({

content:
`تم فتح التكت بنجاح: ${channel}`

});


}


}catch(err){

console.error(
"Interaction Error:",
err
);

}


});
// ================== MESSAGE COMMANDS ==================

client.on('messageCreate', async (message)=>{


if(message.author.bot) return;



// ================== أمر الايموجي ==================

if(message.content.startsWith(EMOJI_PREFIX)){


const args =
message.content
.slice(EMOJI_PREFIX.length)
.trim()
.split(/ +/);



const command =
args.shift().toLowerCase();



if(command === 'ايموجي'){



const emojis =
message.guild.emojis.cache;



if(emojis.size === 0)

return message.reply(
'❌ لا يوجد ايموجيات في السيرفر'
);



await message.channel.send(
`⏳ جاري إرسال (${emojis.size}) ايموجي`
);



for(const [id,emoji] of emojis){


await message.channel.send(`${emoji}`)
.catch(()=>{});


await new Promise(
resolve=>setTimeout(resolve,1000)
);


}



return message.channel.send(
'✅ تم إرسال جميع الايموجيات'
);


}


}



// ================== PREFIX ==================

if(!message.content.startsWith(PREFIX))
return;



const args =
message.content
.slice(PREFIX.length)
.trim()
.split(/ +);



const cmd =
args.shift().toLowerCase();




// ================== -رسالة ==================

if(cmd === 'رسالة'){


const text =
args.join(' ');



if(!text)

return message.reply(
'❌ اكتب الرسالة'
);



await message.delete()
.catch(()=>{});



return message.channel.send(text);


}





// ================== -say ==================

if(cmd === 'say'){



if(
!message.member.permissions.has(
PermissionsBitField.Flags.ManageMessages
)
)

return message.reply(
'❌ ليس لديك صلاحية'
);



const text =
args.join(' ');



if(!text)

return message.reply(
'❌ اكتب النص'
);



await message.delete()
.catch(()=>{});



const embed =
new EmbedBuilder()

.setColor('#8a2be2')

.setDescription(text);



return message.channel.send({

embeds:[embed]

});


}




// ================== -ارسل ==================

if(cmd === 'ارسل'){



if(
!message.member.permissions.has(
PermissionsBitField.Flags.Administrator
)
)

return message.reply(
'❌ لا تملك صلاحية'
);



const channel =
message.guild.channels.cache.get(
BUTTON_ROOM_ID
);



if(!channel)

return message.reply(
'❌ الروم غير موجود'
);



const embed =
new EmbedBuilder()

.setColor('#8a2be2')

.setTitle('**رأيك يهمنا**')

.setThumbnail(THUMB_URL)

.setFooter({

text:
message.guild.name,

iconURL:
message.guild.iconURL()

})

.setTimestamp();



await channel.send({

embeds:[embed],

components:[
createFeedbackButtonRow()
]

});



message.reply(
'✅ تم الإرسال'
);



return;


}




// ================== -خط ==================

if(cmd === 'خط'){


await message.delete()
.catch(()=>{});



return message.channel.send({

content:LINE_URL

});


}




// ================== -علامه ==================

if(cmd === 'علامه'){


client.user.setPresence({

activities:[

{

name:'Next Shop',

type:0

}

],


status:'online'


});



return message.reply(
'✅ تم تشغيل الحالة'
);


}




// ================== -روم ==================

if(cmd === 'روم'){


const channel =
message.guild.channels.cache.get(
AFK_VC_ID
);



if(
!channel ||
channel.type !== ChannelType.GuildVoice
)

return message.reply(
'❌ الروم غير موجود'
);



try{


joinVoiceChannel({

channelId:channel.id,

guildId:message.guild.id,

adapterCreator:
message.guild.voiceAdapterCreator,

selfDeaf:true,

selfMute:true

});



return message.reply(
'🎧 دخلت الروم'
);



}catch(err){


console.error(err);


return message.reply(
'❌ خطأ بالصوت'
);


}


}



});




// ================== إرسال الخط عند - ==================

client.on('messageCreate', async(message)=>{


if(message.author.bot)
return;



if(message.content === '-'){


await message.delete()
.catch(()=>{});



message.channel.send({

content:LINE_URL

});


}


});




// ================== LOGIN ==================
console.log("Starting bot...");
client.login(process.env.TOKEN);