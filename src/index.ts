import { InteractionType, InteractionResponseType, verifyKeyMiddleware } from 'discord-interactions';
import { Intents, Client } from 'discord.js';
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const applicationId = process.env.APPLICATION_ID || '';
const guildId = process.env.GUILD_ID || '';
const token = process.env.PRODUCTION_TOKEN || '';
const publicKey = process.env.PUBLIC_KEY || '';

const discordApi = axios.create({
    baseURL: 'https://discord.com/api/',
    timeout: 3000,
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Authorization',
        Authorization: `Bot ${token}`,
    },
});

app.post('/interactions', verifyKeyMiddleware(publicKey), async (req, res) => {
    const interaction: any = req.body;

    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
        console.log(interaction.data.name);
        if (interaction.data.name == 'yo') {
            return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: `Yo ${interaction.member.user.username}!`,
                },
            });
        }

        if (interaction.data.name == 'dm') {
            // https://discord.com/developers/docs/resources/user#create-dm
            let c = (
                await discordApi.post(`/users/@me/channels`, {
                    recipient_id: interaction.member.user.id,
                })
            ).data;
            try {
                // https://discord.com/developers/docs/resources/channel#create-message
                let res = await discordApi.post(`/channels/${c.id}/messages`, {
                    content: 'Yo! I got your slash command. I am not able to respond to DMs just slash commands.',
                });
                console.log(res.data);
            } catch (e) {
                console.log(e);
            }

            return res.send({
                // https://discord.com/developers/docs/interactions/receiving-and-responding#responding-to-an-interaction
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: '👍',
                },
            });
        }
    }
});

app.get('/register_commands', async (_, res) => {
    let slash_commands = [
        {
            name: 'yo',
            description: 'replies with Yo!',
            options: [],
        },
        {
            name: 'dm',
            description: 'sends user a DM',
            options: [],
        },
    ];
    try {
        // api docs - https://discord.com/developers/docs/interactions/application-commands#create-global-application-command
        let discord_response = await discordApi.put(
            `/applications/${applicationId}/guilds/${guildId}/commands`,
            slash_commands
        );
        console.log(discord_response.data);
        return res.send('commands have been registered');
    } catch (e: any) {
        console.error(e.code);
        console.error(e.response?.data);
        return res.send(`${e.code} error from discord`);
    }
});

app.get('/', async (_, res) => {
    return res.send('Follow documentation ');
});

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// client.on('ready', async () => {
//     const data = [
//         {
//             name: 'ping',
//             description: 'Replies with Pong!',
//         },
//         {
//             name: 'ping2',
//             description: 'Replies with ephemeral Pong!',
//         },
//     ];

//     await client.application?.commands.set(data, guildId);
//     console.log('Ready!');
// });

// client.on('interactionCreate', async (interaction) => {
//     if (!interaction.isCommand()) {
//         return;
//     }

//     if (interaction.commandName === 'ping') {
//         await interaction.reply('Pong!');
//     }

//     if (interaction.commandName === 'ping2') {
//         await interaction.reply({ content: 'Pong!', ephemeral: true });
//     }
// });

app.listen(PORT, () => {
    client.login(process.env.PRODUCTION_TOKEN);
    console.log(`Our app is running on port ${PORT}`);
});
