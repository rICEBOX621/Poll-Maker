require('dotenv').config();

const Canvas = require('canvas');
const Discord = require('discord.js');
const { Client, MessageReaction, Emoji, Guild, DiscordAPIError } = require('discord.js');
const client = new Client();
const guild = new Guild();
const PREFIX = "$";
const num = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];


//parses through the inputted values and returns a string
function parse(args, x){
    const question = args[x].substring(0, args[x].length - 1);
    let str = question;
    for(let i = 1+x; i < args.length; ++i){
        str += '\n-';
        str += num[i-1-x] + ' ';
        str += args[i].substring(0, args[i].length - 1);
    }
    return str;
}

//converts inputted time into miliseconds
function conversion(time){
    let result = time[0] * 3600000 + time[1] * 60000 + time[2] * 1000;
    return result;
}

client.on('ready', () => {
    console.log(`${client.user.tag} has logged in`);
});

client.on('message', async (message) => {
    if(message.author.bot) return;
    if(message.content.startsWith(PREFIX)){
        const [CMD_NAME, ...args] = message.content
            .trim()
            .substring(PREFIX.length)
            .split(/\s+"/); 
            
        if(CMD_NAME === 'commands'){    //in the case of $commands
            message.channel.send('-$poll will generate a poll with emojis \n-$horizpoll will generate a poll with a horizontal bar graph after a specified period of time \n-$vertpoll will generate a poll with a vertical bar graph after a specified period of time');
        } else if (CMD_NAME === 'poll'){    //in the case of $poll and args
            if(args.length === 0){
                message.channel.send('initiate poll by asking a question followed by options (in quotations i.e \n$poll "do you like sushi or pizza" "sushi" "pizza")');
            } else if(args.length === 1){
                message.channel.send('follow the question with the poll with options in quotations');
            } else if(args.length <= 11){
                let str = parse(args, 0);
                await message.channel.send("**"+str+"**").then(messageReaction => {
                    for(let i = 1; i < args.length; ++i){
                        messageReaction.react(num[i-1]);
                    }
                    message.delete({ timeout: 3000 }).catch(console.error);
                });
            } else {
                message.channel.send('there were too many options, please limit the options to 10 or less');
            }
        } else if(CMD_NAME === 'vertpoll' || CMD_NAME === 'horizpoll'){ //$vertpoll or $horizpoll
            if(args.length < 3){
                message.channel.send('initiate poll first giving the before a graph is generated followed by asking a question followed by options (in quotations i.e \n$(vert/horiz)poll "00:00:50" "do you like sushi or pizza" "sushi" "pizza")\nThe timing will be first hours, minutes, and then seconds');
            } else if(args.length <= 12){   
                let timeArr = args[0].split(":");   //splits time and places the values into an array
                timeArr[2] = timeArr[2].substring(0, timeArr[2].length - 1);
                let timeWait = conversion(timeArr); //calls for conversion into miliseconds
                let str = parse(args, 1);   //calls for parse function
                let msg = await message.channel.send("**"+str+"**");
                for(let i = 2; i < args.length; ++i) {  //waits for message reactions
                    await msg.react(num[i-2]);
                }
                const num_reacts = [];
                const filter = (reaction) => {return num.includes(reaction.emoji.name)};
                const reactions = msg.awaitReactions(filter, {time: timeWait})
                    .then(async (collected) => {
                        for(let i = 2; i < args.length; i++) {  //records number of reactions for each emote and pushes into num_reacts
                            if(collected.get(num[i-2]) == undefined) {
                                num_reacts.push(0);
                            } else {
                                num_reacts.push(collected.get(num[i-2]).count - 1);
                            }
                        }
                        
                        const num_ppl = message.guild.memberCount;
                        const num_options = args.length - 2;
                        
                        const canvas = Canvas.createCanvas(700, 700);   
                        const ctx = canvas.getContext('2d');

                        const background = await Canvas.loadImage('./red.jpg');
                        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
                        ctx.font = "20px Arial";

                        if(CMD_NAME === 'vertpoll'){
                            let y_scale = canvas.height/num_options;
                            let increment = canvas.width/num_ppl;
                            for(let i = 0; i < num_reacts.length; ++i) {    //draws in accordance to poll results and labels the choices
                                ctx.fillRect(0, i * y_scale, num_reacts[i] * increment, y_scale);
                                ctx.fillStyle = "white";
                                ctx.fillText(i + 1 + ":" + num_reacts[i], 0, (i * y_scale) + (y_scale/num_options));
                                ctx.fillStyle = "black";
                            }
                        } else {
                            let x_scale = canvas.width/num_options;
                            let increment = canvas.height/num_ppl;
                            for(let i = 0; i < num_reacts.length; ++i) {    //draws in accordance to poll results and labels the choices
                                ctx.fillRect(i * x_scale, canvas.height, x_scale, -num_reacts[i] * increment);
                                ctx.fillStyle = "white";
                                ctx.fillText(i + 1 + ":" + num_reacts[i], (i * x_scale) + (x_scale/num_options), canvas.height);
                                ctx.fillStyle = "black";
                            }
                        }

                        const attachment = new Discord.MessageAttachment(canvas.toBuffer());

                        message.channel.send(attachment);
                    });
                message.delete({ timeout: 3000 }).catch(console.error);    
            }
        } else {
            message.channel.send('this is not a valid command OR quotations were forgotten');
        }
    }
});
client.login(process.env.DISCORDJS_BOT_TOKEN);
