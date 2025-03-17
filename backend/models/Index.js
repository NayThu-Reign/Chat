const Chat = require('./Chat');
const ChatOwner = require('./ChatOwner');
const ChatParticipant = require('./ChatParticipant');
const HiddenChat = require('./HiddenChat');
const Mention = require('./Mention');
const Message = require('./Message');
const Reaction = require('./Reaction');
const User = require('./User');


Mention.belongsTo(Message, { foreignKey: 'message_id', as: 'mentionedInMessage', onDelete: 'CASCADE' });
Mention.belongsTo(User, { foreignKey: 'mentioned_user_id', as: 'mentionedUser', onDelete: 'CASCADE' });
Chat.hasMany(ChatParticipant, { foreignKey: 'chat_id', as: 'chatParticipants' });
ChatParticipant.belongsTo(Chat, { foreignKey: 'chat_id', as: 'chat' });
Chat.hasMany(HiddenChat, { foreignKey: 'chat_id', as: 'hiddenChats' });
HiddenChat.belongsTo(Chat, { foreignKey: 'chat_id', as: 'chat' });

Message.hasMany(Reaction, { foreignKey: 'message_id', as: 'reactions', onDelete: 'CASCADE' });
Reaction.belongsTo(Message, { foreignKey: 'message_id', as: "messages" });

Chat.hasMany(ChatOwner, {
    foreignKey: 'chat_id',
    as: 'ownerAdmins', // Alias used in the include query
    onDelete: 'CASCADE',
});

// ChatOwner belongs to a specific Chat
ChatOwner.belongsTo(Chat, {
    foreignKey: 'chat_id',
    as: 'chat',
});

Message.belongsTo(Message, {
    foreignKey: 'forwarded_from',
    as: 'originalForwardMessage'  
});

Message.hasMany(Message, {
    foreignKey: 'forwarded_from',
    as: 'forwardedMessages' 
});

Message.belongsTo(Message, { 
    foreignKey: 'reply_to',
    as: 'originalMessage'
});

Message.hasMany(Message, {
    foreignKey: 'reply_to',
    as: 'repliedMessages'
});



Chat.hasMany(Message, {
    foreignKey: 'chat_id',
    as: 'messages',
    onDelete: 'CASCADE'
});

Message.belongsTo(Chat, {
    foreignKey: 'chat_id',
    as: 'chat'
});










