const express = require("express");
const path = require("path");

var app = express();
var server = app.listen(3000, function () {
    console.log("Listening on port 3000");
});

const io = require("socket.io")(server, {
    allowEIO3: true,
});
app.use(express.static(path.join(__dirname, "")));
var userConnections = [];
io.on("connection", (socket) => {
    console.log("socket id is ", socket.id);
    socket.on("userconnect", (data) => {
        console.log("userconnect", data.displayName, data.meetingid);
        var other_user = userConnections.filter((p) => p.meeting_id == data.meetingid);
        userConnections.push({
            connectionID: socket.id,
            user_id: data.displayName,
            meeting_id: data.meetingid,
        });
        other_user.forEach((v) => {
            socket.to(v.connectionID).emit("inform_others_about_me", {
                other_user_id: data.displayName,
                connId: socket.id,
            })
        })
        socket.emit("inform_me_about_other_user", other_user);


    });
    socket.on("SDPProcess", (data) => {
        socket.to(data.to_connid).emit("SDPProcess", {
            message: data.message,
            from_connid: socket.id,
        })
    })

    socket.on("disconnect", function () {
        console.log("Disconnected");
        var disUser = userConnections.find((p) => p.connectionID == socket.id);
        if (disUser) {
            var meetingid = disUser.meeting_id;
            userConnections = userConnections.filter((p) => p.connectionID != socket.id);
            var list = userConnections.filter((p) => p.meeting_id == meetingid);
            list.forEach((v) => {
                socket.to(v.connectionID).emit("inform_other_about_disconnected_user", {
                    connId: socket.id,
                });
            });
        }
    });

    });


