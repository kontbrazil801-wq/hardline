require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require("discord.js");


/* ==================================================
   EXPRESS
================================================== */

const app = express();

const PORT = process.env.PORT || 3000;


/* ==================================================
   DISCORD CONFIG
================================================== */

const APPLICATION_CHANNEL_ID =
    "1536088115385733264";

const RESULT_CHANNEL_ID =
    "1536088101833678928";


/*
   ROLE GIVEN WHEN APPLICATION IS ACCEPTED
*/

const ACCEPTED_ROLE_ID =
    "1536087740976992298";


/*
   WHITELIST WEBSITE
*/

const WHITELIST_URL =
    "https://hardline.wlapp.com";

const WHITELIST_NAME =
    "Hardline RolePlay Whitelist";


/* ==================================================
   APPLICATION DATABASE
================================================== */

const APPLICATIONS_FILE =
    path.join(
        __dirname,
        "applications.json"
    );


function loadApplications() {

    try {

        if (!fs.existsSync(APPLICATIONS_FILE)) {

            fs.writeFileSync(
                APPLICATIONS_FILE,
                "{}",
                "utf8"
            );

            return {};

        }

        const file =
            fs.readFileSync(
                APPLICATIONS_FILE,
                "utf8"
            );

        if (!file.trim()) {

            return {};

        }

        return JSON.parse(file);

    } catch (error) {

        console.error(
            "❌ Error reading applications.json:",
            error
        );

        return {};

    }

}


function saveApplications(data) {

    fs.writeFileSync(
        APPLICATIONS_FILE,
        JSON.stringify(
            data,
            null,
            4
        ),
        "utf8"
    );

}


const applications =
    loadApplications();


/* ==================================================
   DISCORD CLIENT
================================================== */

const client = new Client({

    intents: [

        GatewayIntentBits.Guilds,

        GatewayIntentBits.GuildMembers

    ]

});


/* ==================================================
   EXPRESS MIDDLEWARE
================================================== */

app.use(
    express.json({
        limit: "1mb"
    })
);

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(
    express.static(
        path.join(
            __dirname,
            "public"
        )
    )
);


/* ==================================================
   HOME
================================================== */

app.get(
    "/",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "public",
                "index.html"
            )
        );

    }
);


/* ==================================================
   SUBMIT APPLICATION
================================================== */

app.post(
    "/api/application",
    async (req, res) => {

        try {

            const data = req.body;


            /* ==================================================
               REQUIRED FIELDS
            ================================================== */

            const requiredFields = [

                "realName",
                "realAge",
                "discordUsername",
                "discordId",
                "howKnow",
                "otherServers",
                "roleplayDefinition",
                "characterName",
                "characterType",
                "backstory",
                "massRp",
                "failRp",
                "coherenceRp",
                "combatStoring",
                "situation1",
                "situation2"

            ];


            for (const field of requiredFields) {

                if (
                    data[field] === undefined ||
                    data[field] === null ||
                    String(data[field]).trim() === ""
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Please complete all required questions."

                    });

                }

            }


            /* ==================================================
               DISCORD ID
            ================================================== */

            const discordId =
                String(
                    data.discordId
                ).trim();


            if (
                !/^\d{17,20}$/.test(
                    discordId
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid Discord ID."

                });

            }


            /* ==================================================
               SITUATIONS
            ================================================== */

            let situation1 =
                String(
                    data.situation1
                ).trim();

            let situation2 =
                String(
                    data.situation2
                ).trim();


            /* ------------------------------------------
               SITUATION 1 = OTHER
            ------------------------------------------ */

            if (
                situation1.toLowerCase() === "other"
            ) {

                const otherText =
                    data.situation1Other
                        ? String(
                            data.situation1Other
                        ).trim()
                        : "";

                if (!otherText) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Please explain your Situation 1 Other answer."

                    });

                }

                situation1 =
                    "Other — " +
                    otherText;

            }


            /* ------------------------------------------
               SITUATION 2 = OTHER
            ------------------------------------------ */

            if (
                situation2.toLowerCase() === "other"
            ) {

                const otherText =
                    data.situation2Other
                        ? String(
                            data.situation2Other
                        ).trim()
                        : "";

                if (!otherText) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Please explain your Situation 2 Other answer."

                    });

                }

                situation2 =
                    "Other — " +
                    otherText;

            }


            /* ==================================================
               DUPLICATE PROTECTION
            ================================================== */

            if (applications[discordId]) {

                const oldApplication =
                    applications[discordId];


                if (
                    oldApplication.status ===
                    "pending"
                ) {

                    return res.status(409).json({

                        success: false,

                        message:
                            "You already have a pending whitelist application."

                    });

                }


                if (
                    oldApplication.status ===
                    "accepted"
                ) {

                    return res.status(409).json({

                        success: false,

                        message:
                            "Your whitelist application has already been accepted."

                    });

                }


                if (
                    oldApplication.status ===
                    "rejected"
                ) {

                    return res.status(409).json({

                        success: false,

                        message:
                            "You already submitted a whitelist application and it was rejected."

                    });

                }

            }


            /* ==================================================
               GET APPLICATION CHANNEL
            ================================================== */

            const channel =
                await client.channels.fetch(
                    APPLICATION_CHANNEL_ID
                );


            if (!channel) {

                throw new Error(
                    "Application channel not found."
                );

            }


            /* ==================================================
               APPLICATION EMBED
            ================================================== */

            const embed =
                new EmbedBuilder()

                    .setTitle(
                        "📋 Hardline RolePlay Whitelist"
                    )

                    .setDescription(
                        `🔗 [${WHITELIST_NAME}](${WHITELIST_URL})`
                    )

                    .addFields(

                        {
                            name:
                                "👤 Real Life Name",

                            value:
                                escapeDiscord(
                                    data.realName
                                ).slice(0, 1024),

                            inline:
                                true
                        },

                        {
                            name:
                                "🎂 Real Life Age",

                            value:
                                escapeDiscord(
                                    data.realAge
                                ).slice(0, 1024),

                            inline:
                                true
                        },

                        {
                            name:
                                "💬 Discord Username",

                            value:
                                escapeDiscord(
                                    data.discordUsername
                                ).slice(0, 1024),

                            inline:
                                true
                        },

                        {
                            name:
                                "🆔 Discord ID",

                            value:
                                discordId,

                            inline:
                                true
                        },

                        {
                            name:
                                "Question 3 — How Did You Know Our Server?",

                            value:
                                escapeDiscord(
                                    data.howKnow
                                ).slice(0, 1024)
                        },

                        {
                            name:
                                "Question 4 — Other Servers",

                            value:
                                escapeDiscord(
                                    data.otherServers
                                ).slice(0, 1024)
                        },

                        {
                            name:
                                "Question 5 — Definition Of Roleplay",

                            value:
                                escapeDiscord(
                                    data.roleplayDefinition
                                ).slice(0, 1024)
                        },

                        {
                            name:
                                "Question 6 — Character Name",

                            value:
                                escapeDiscord(
                                    data.characterName
                                ).slice(0, 1024)
                        },

                        {
                            name:
                                "Question 7 — Character Type",

                            value:
                                escapeDiscord(
                                    data.characterType
                                ).slice(0, 1024)
                        },

                        {
                            name:
                                "Question 8 — Character Backstory & Objectives",

                            value:
                                escapeDiscord(
                                    data.backstory
                                ).slice(0, 1024)
                        },

                        {
                            name:
                                "Question 9 — Mass RP",

                            value:
                                escapeDiscord(
                                    data.massRp
                                ).slice(0, 1024)
                        },

                        {
                            name:
                                "Question 10 — Fail RP",

                            value:
                                escapeDiscord(
                                    data.failRp
                                ).slice(0, 1024)
                        },

                        {
                            name:
                                "Question 11 — Coherence RP",

                            value:
                                escapeDiscord(
                                    data.coherenceRp
                                ).slice(0, 1024)
                        },

                        {
                            name:
                                "Question 12 — Combat Storing",

                            value:
                                escapeDiscord(
                                    data.combatStoring
                                ).slice(0, 1024)
                        },

                        {
                            name:
                                "Situation N°1",

                            value:
                                escapeDiscord(
                                    situation1
                                ).slice(0, 1024)
                        },

                        {
                            name:
                                "Situation N°2",

                            value:
                                escapeDiscord(
                                    situation2
                                ).slice(0, 1024)
                        }

                    )

                    .setFooter({

                        text:
                            "Hardline RolePlay • Pending"

                    })

                    .setTimestamp();


            /* ==================================================
               BUTTONS
            ================================================== */

            const buttons =
                new ActionRowBuilder()
                    .addComponents(

                        new ButtonBuilder()

                            .setCustomId(
                                "whitelist_accept"
                            )

                            .setLabel(
                                "Accept"
                            )

                            .setEmoji(
                                "✅"
                            )

                            .setStyle(
                                ButtonStyle.Success
                            ),

                        new ButtonBuilder()

                            .setCustomId(
                                "whitelist_deny"
                            )

                            .setLabel(
                                "Denied"
                            )

                            .setEmoji(
                                "❌"
                            )

                            .setStyle(
                                ButtonStyle.Danger
                            )

                    );


            /* ==================================================
               SEND APPLICATION TO DISCORD
            ================================================== */

            const sentMessage =
                await channel.send({

                    embeds: [
                        embed
                    ],

                    components: [
                        buttons
                    ]

                });


            /* ==================================================
               SAVE APPLICATION
            ================================================== */

            applications[discordId] = {

                discordId:
                    discordId,

                discordUsername:
                    String(
                        data.discordUsername
                    ).trim(),

                status:
                    "pending",

                applicationMessageId:
                    sentMessage.id,

                applicationChannelId:
                    APPLICATION_CHANNEL_ID,

                submittedAt:
                    new Date().toISOString()

            };


            saveApplications(
                applications
            );


            /* ==================================================
               SUCCESS
            ================================================== */

            return res.json({

                success: true,

                message:
                    "Application submitted successfully."

            });


        } catch (error) {

            console.error(
                "❌ Application error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "An error occurred while submitting your application."

            });

        }

    }
);


/* ==================================================
   DISCORD INTERACTIONS
================================================== */

client.on(
    "interactionCreate",
    async interaction => {


        /* ==================================================
           ACCEPT BUTTON
        ================================================== */

        if (
            interaction.isButton() &&
            interaction.customId ===
                "whitelist_accept"
        ) {

            try {

                await interaction.deferReply({
                    ephemeral: true
                });


                /* ==================================================
                   GET MESSAGE
                ================================================== */

                const message =
                    interaction.message;


                const embed =
                    message.embeds[0];


                if (!embed) {

                    return interaction.editReply(
                        "❌ Application information not found."
                    );

                }


                /* ==================================================
                   GET DISCORD ID
                ================================================== */

                const discordIdField =
                    embed.fields.find(
                        field =>
                            field.name ===
                            "🆔 Discord ID"
                    );


                if (!discordIdField) {

                    return interaction.editReply(
                        "❌ Discord ID could not be found."
                    );

                }


                const discordId =
                    discordIdField.value.trim();


                if (
                    !/^\d{17,20}$/.test(
                        discordId
                    )
                ) {

                    return interaction.editReply(
                        "❌ Invalid Discord ID."
                    );

                }


                /* ==================================================
                   DATABASE
                ================================================== */

                const application =
                    applications[discordId];


                if (!application) {

                    return interaction.editReply(
                        "❌ Application was not found in the database."
                    );

                }


                if (
                    application.status ===
                    "accepted"
                ) {

                    return interaction.editReply(
                        "⚠️ This application has already been accepted."
                    );

                }


                if (
                    application.status ===
                    "rejected"
                ) {

                    return interaction.editReply(
                        "⚠️ This application has already been rejected."
                    );

                }


                /* ==================================================
                   GUILD
                ================================================== */

                const guild =
                    interaction.guild;


                if (!guild) {

                    return interaction.editReply(
                        "❌ Guild not found."
                    );

                }


                /* ==================================================
                   GET MEMBER
                ================================================== */

                let member;

                try {

                    member =
                        await guild.members.fetch(
                            discordId
                        );

                } catch {

                    return interaction.editReply(
                        "❌ This applicant is not in the Discord server."
                    );

                }


                /* ==================================================
                   GET ACCEPTED ROLE
                ================================================== */

                const role =
                    await guild.roles.fetch(
                        ACCEPTED_ROLE_ID
                    );


                if (!role) {

                    return interaction.editReply(
                        "❌ Accepted role not found."
                    );

                }


                /* ==================================================
                   BOT ROLE POSITION
                ================================================== */

                const botMember =
                    guild.members.me ||
                    await guild.members.fetch(
                        client.user.id
                    );


                if (
                    role.position >=
                    botMember.roles.highest.position
                ) {

                    return interaction.editReply(
                        "❌ I cannot give the Accepted role because my bot role is below it in the Discord role list."
                    );

                }


                /* ==================================================
                   GIVE ACCEPTED ROLE
                ================================================== */

                if (
                    !member.roles.cache.has(
                        ACCEPTED_ROLE_ID
                    )
                ) {

                    await member.roles.add(
                        role
                    );

                }


                /* ==================================================
                   RESULT CHANNEL
                ================================================== */

                const resultChannel =
                    await client.channels.fetch(
                        RESULT_CHANNEL_ID
                    );


                if (!resultChannel) {

                    return interaction.editReply(
                        "❌ Result channel not found."
                    );

                }


                /* ==================================================
                   ACCEPTED EMBED
                ================================================== */

                const acceptedEmbed =
                    new EmbedBuilder()

                        .setTitle(
                            "✅ Whitelist Accepted"
                        )

                        .setDescription(

                            "Your Whitelist Application has been accepted [✅]\n\n" +

                            "Welcome aboard! See you in the interview [💕]!\n\n" +

                            `🔗 [${WHITELIST_NAME}](${WHITELIST_URL})`

                        )

                        .setFooter({

                            text:
                                "Hardline RolePlay"

                        })

                        .setTimestamp();


                /* ==================================================
                   TAG USER IN RESULT CHANNEL
                ================================================== */

                await resultChannel.send({

                    content:
                        `<@${discordId}>`,

                    embeds: [
                        acceptedEmbed
                    ],

                    allowedMentions: {

                        users: [
                            discordId
                        ]

                    }

                });


                /* ==================================================
                   DATABASE UPDATE
                ================================================== */

                applications[discordId].status =
                    "accepted";

                applications[discordId].decidedAt =
                    new Date().toISOString();

                applications[discordId].decidedBy =
                    interaction.user.id;


                saveApplications(
                    applications
                );


                /* ==================================================
                   DISABLE BUTTONS
                ================================================== */

                const disabledButtons =
                    new ActionRowBuilder()
                        .addComponents(

                            new ButtonBuilder()

                                .setCustomId(
                                    "accepted_disabled"
                                )

                                .setLabel(
                                    "Accepted"
                                )

                                .setEmoji(
                                    "✅"
                                )

                                .setStyle(
                                    ButtonStyle.Success
                                )

                                .setDisabled(
                                    true
                                ),

                            new ButtonBuilder()

                                .setCustomId(
                                    "denied_disabled"
                                )

                                .setLabel(
                                    "Denied"
                                )

                                .setEmoji(
                                    "❌"
                                )

                                .setStyle(
                                    ButtonStyle.Danger
                                )

                                .setDisabled(
                                    true
                                )

                        );


                await message.edit({

                    components: [
                        disabledButtons
                    ]

                });


                /* ==================================================
                   ADMIN RESPONSE
                ================================================== */

                await interaction.editReply(

                    "✅ Application accepted, user tagged, role given, and result sent."

                );


            } catch (error) {

                console.error(
                    "❌ Accept error:",
                    error
                );


                if (
                    interaction.deferred ||
                    interaction.replied
                ) {

                    await interaction.editReply(
                        "❌ Something went wrong while accepting the application."
                    );

                }

            }


            return;

        }


        /* ==================================================
           DENIED BUTTON
        ================================================== */

        if (
            interaction.isButton() &&
            interaction.customId ===
                "whitelist_deny"
        ) {

            try {

                const modal =
                    new ModalBuilder()

                        .setCustomId(
                            "whitelist_deny_modal_" +
                            interaction.message.id
                        )

                        .setTitle(
                            "Reject Whitelist Application"
                        );


                const reasonInput =
                    new TextInputBuilder()

                        .setCustomId(
                            "deny_reason"
                        )

                        .setLabel(
                            "Reason"
                        )

                        .setPlaceholder(
                            "Enter the reason for rejection..."
                        )

                        .setStyle(
                            TextInputStyle.Paragraph
                        )

                        .setRequired(
                            true
                        )

                        .setMaxLength(
                            1000
                        );


                const row =
                    new ActionRowBuilder()
                        .addComponents(
                            reasonInput
                        );


                modal.addComponents(
                    row
                );


                await interaction.showModal(
                    modal
                );


            } catch (error) {

                console.error(
                    "❌ Deny modal error:",
                    error
                );

            }


            return;

        }


        /* ==================================================
           DENIED MODAL
        ================================================== */

        if (
            interaction.isModalSubmit() &&
            interaction.customId.startsWith(
                "whitelist_deny_modal_"
            )
        ) {

            try {

                await interaction.deferReply({
                    ephemeral: true
                });


                /* ==================================================
                   GET MESSAGE ID
                ================================================== */

                const messageId =
                    interaction.customId.replace(
                        "whitelist_deny_modal_",
                        ""
                    );


                /* ==================================================
                   GET ORIGINAL MESSAGE
                ================================================== */

                let originalMessage;

                try {

                    originalMessage =
                        await interaction.channel.messages.fetch(
                            messageId
                        );

                } catch {

                    return interaction.editReply(
                        "❌ Original application message could not be found."
                    );

                }


                const embed =
                    originalMessage.embeds[0];


                if (!embed) {

                    return interaction.editReply(
                        "❌ Application information not found."
                    );

                }


                /* ==================================================
                   GET DISCORD ID
                ================================================== */

                const discordIdField =
                    embed.fields.find(
                        field =>
                            field.name ===
                            "🆔 Discord ID"
                    );


                if (!discordIdField) {

                    return interaction.editReply(
                        "❌ Discord ID could not be found."
                    );

                }


                const discordId =
                    discordIdField.value.trim();


                if (
                    !/^\d{17,20}$/.test(
                        discordId
                    )
                ) {

                    return interaction.editReply(
                        "❌ Invalid Discord ID."
                    );

                }


                /* ==================================================
                   DATABASE
                ================================================== */

                const application =
                    applications[discordId];


                if (!application) {

                    return interaction.editReply(
                        "❌ Application was not found in the database."
                    );

                }


                if (
                    application.status ===
                    "accepted"
                ) {

                    return interaction.editReply(
                        "⚠️ This application has already been accepted."
                    );

                }


                if (
                    application.status ===
                    "rejected"
                ) {

                    return interaction.editReply(
                        "⚠️ This application has already been rejected."
                    );

                }


                /* ==================================================
                   REASON
                ================================================== */

                const reason =
                    interaction.fields.getTextInputValue(
                        "deny_reason"
                    );


                /* ==================================================
                   RESULT CHANNEL
                ================================================== */

                const resultChannel =
                    await client.channels.fetch(
                        RESULT_CHANNEL_ID
                    );


                if (!resultChannel) {

                    return interaction.editReply(
                        "❌ Result channel not found."
                    );

                }


                /* ==================================================
                   REJECTED EMBED
                ================================================== */

                const deniedEmbed =
                    new EmbedBuilder()

                        .setTitle(
                            "❌ Whitelist Rejected"
                        )

                        .setDescription(

                            "Sorry.. But Your Whitelist application has been rejected.\n\n" +

                            "**Reason:**\n" +

                            escapeDiscord(
                                reason
                            ) +

                            `\n\n🔗 [${WHITELIST_NAME}](${WHITELIST_URL})`

                        )

                        .setFooter({

                            text:
                                "Hardline RolePlay"

                        })

                        .setTimestamp();


                /* ==================================================
                   TAG USER IN RESULT CHANNEL
                ================================================== */

                await resultChannel.send({

                    content:
                        `<@${discordId}>`,

                    embeds: [
                        deniedEmbed
                    ],

                    allowedMentions: {

                        users: [
                            discordId
                        ]

                    }

                });


                /* ==================================================
                   DATABASE UPDATE
                ================================================== */

                applications[discordId].status =
                    "rejected";

                applications[discordId].reason =
                    reason;

                applications[discordId].decidedAt =
                    new Date().toISOString();

                applications[discordId].decidedBy =
                    interaction.user.id;


                saveApplications(
                    applications
                );


                /* ==================================================
                   DISABLE BUTTONS
                ================================================== */

                const disabledButtons =
                    new ActionRowBuilder()
                        .addComponents(

                            new ButtonBuilder()

                                .setCustomId(
                                    "accepted_disabled"
                                )

                                .setLabel(
                                    "Accepted"
                                )

                                .setEmoji(
                                    "✅"
                                )

                                .setStyle(
                                    ButtonStyle.Success
                                )

                                .setDisabled(
                                    true
                                ),

                            new ButtonBuilder()

                                .setCustomId(
                                    "denied_disabled"
                                )

                                .setLabel(
                                    "Denied"
                                )

                                .setEmoji(
                                    "❌"
                                )

                                .setStyle(
                                    ButtonStyle.Danger
                                )

                                .setDisabled(
                                    true
                                )

                        );


                await originalMessage.edit({

                    components: [
                        disabledButtons
                    ]

                });


                /* ==================================================
                   ADMIN RESPONSE
                ================================================== */

                await interaction.editReply(

                    "❌ Application rejected, user tagged, and result sent."

                );


            } catch (error) {

                console.error(
                    "❌ Denied error:",
                    error
                );


                if (
                    interaction.deferred ||
                    interaction.replied
                ) {

                    await interaction.editReply(
                        "❌ Something went wrong while rejecting the application."
                    );

                }

            }

        }

    }
);


/* ==================================================
   READY
================================================== */

client.once(
    "clientReady",
    () => {

        console.log(
            "===================================="
        );

        console.log(
            "✅ Discord Bot Connected"
        );

        console.log(
            "🤖 Logged in as: " +
            client.user.tag
        );

        console.log(
            "🌐 Website Port: " +
            PORT
        );

        console.log(
            "🔗 Whitelist URL: " +
            WHITELIST_URL
        );

        console.log(
            "===================================="
        );

    }
);


/* ==================================================
   ERROR HANDLER
================================================== */

client.on(
    "error",
    error => {

        console.error(
            "❌ Discord Client Error:",
            error
        );

    }
);


/* ==================================================
   START WEBSITE
================================================== */

app.listen(
    PORT,
    () => {

        console.log(
            "🌐 Website running on port " +
            PORT
        );

    }
);


/* ==================================================
   LOGIN
================================================== */

client.login(
    process.env.TOKEN
);


/* ==================================================
   ESCAPE DISCORD TEXT
================================================== */

function escapeDiscord(text) {

    if (
        text === undefined ||
        text === null
    ) {

        return "N/A";

    }


    const value =
        String(text).trim();


    if (!value) {

        return "N/A";

    }


    return value

        .replace(
            /@everyone/g,
            "@\u200beveryone"
        )

        .replace(
            /@here/g,
            "@\u200bhere"
        );

}
