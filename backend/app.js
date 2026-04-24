const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const leaderboardRoutes = require("./routes/leaderboard.routes");
const botRoutes = require("./routes/bot.routes");
const friendlyRoutes = require("./routes/friendly.routes");
const rankedRoutes = require("./routes/ranked.routes");
const runsRoutes = require("./routes/runs.routes");
const pvpRoutes = require("./routes/pvp.routes");
const userRoutes = require("./routes/users.routes");
const friendsRoutes = require("./routes/friends.routes");
const invitesRoutes = require("./routes/invites.routes");
const authMiddleware = require('./middleware/auth');
const updateOnlineMiddleware = require('./middleware/update-online');

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running!");
});

app.use("/auth", authRoutes);

app.use(authMiddleware);
app.use(updateOnlineMiddleware);

app.use("/leaderboard", leaderboardRoutes);
app.use("/bot", botRoutes);
app.use("/friendly", friendlyRoutes);
app.use("/ranked", rankedRoutes);
app.use("/runs", runsRoutes);
app.use("/pvp", pvpRoutes);
app.use("/users", userRoutes);
app.use("/friends", friendsRoutes);
app.use("/invites", invitesRoutes);

module.exports = app;
