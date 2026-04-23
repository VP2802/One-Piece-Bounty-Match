const db = require("../db");
const { createFriendlyRoomForUser, joinFriendlyRoomByCode } = require("./room.service");

function sendMatchInvite(req, res) {
  const { sender_user_id, receiver_user_id } = req.body;

  if (!sender_user_id || !receiver_user_id) {
    return res.status(400).json({
      message: "Missing sender_user_id or receiver_user_id"
    });
  }

  if (Number(sender_user_id) === Number(receiver_user_id)) {
    return res.status(400).json({
      message: "You cannot invite yourself"
    });
  }

  const checkFriendsSql = `
    SELECT id
    FROM friend_requests
    WHERE
      status = 'accepted'
      AND (
        (sender_user_id = ? AND receiver_user_id = ?)
        OR
        (sender_user_id = ? AND receiver_user_id = ?)
      )
    LIMIT 1
  `;

  db.query(
    checkFriendsSql,
    [sender_user_id, receiver_user_id, receiver_user_id, sender_user_id],
    (checkErr, friendRows) => {
      if (checkErr) {
        return res.status(500).json({
          message: "Failed to validate friendship",
          error: checkErr.message
        });
      }

      if (!friendRows.length) {
        return res.status(403).json({
          message: "Only friends can send match invites"
        });
      }

      const checkPendingSql = `
        SELECT id
        FROM match_invites
        WHERE
          sender_user_id = ?
          AND receiver_user_id = ?
          AND status = 'pending'
        LIMIT 1
      `;

      db.query(
        checkPendingSql,
        [sender_user_id, receiver_user_id],
        (pendingErr, pendingRows) => {
          if (pendingErr) {
            return res.status(500).json({
              message: "Failed to check pending invites",
              error: pendingErr.message
            });
          }

          if (pendingRows.length > 0) {
            return res.status(409).json({
              message: "A pending match invite already exists"
            });
          }

          createFriendlyRoomForUser(sender_user_id, (roomErr, room) => {
            if (roomErr) {
              return res.status(500).json({
                message: "Failed to create friendly room for invite",
                error: roomErr.message
              });
            }

            const insertSql = `
              INSERT INTO match_invites (
                sender_user_id,
                receiver_user_id,
                room_mode,
                room_code,
                status
              )
              VALUES (?, ?, 'friendly', ?, 'pending')
            `;

            db.query(
              insertSql,
              [sender_user_id, receiver_user_id, room.room_code],
              (insertErr, insertResult) => {
                if (insertErr) {
                  return res.status(500).json({
                    message: "Failed to create match invite",
                    error: insertErr.message
                  });
                }

                return res.status(201).json({
                  message: "Friendly match invite sent successfully",
                  invite: {
                    id: insertResult.insertId,
                    sender_user_id: Number(sender_user_id),
                    receiver_user_id: Number(receiver_user_id),
                    room_mode: "friendly",
                    room_code: room.room_code,
                    status: "pending"
                  },
                  room
                });
              }
            );
          });
        }
      );
    }
  );
}

function getIncomingMatchInvites(req, res) {
  const { userId } = req.params;

  const sql = `
    SELECT
      mi.id,
      mi.sender_user_id,
      mi.room_mode,
      mi.room_code,
      mi.status,
      mi.created_at,
      u.player_name,
      u.faction,
      ls.ranking_points,
      ls.current_rank
    FROM match_invites mi
    JOIN users u ON mi.sender_user_id = u.id
    LEFT JOIN leaderboard_stats ls ON u.id = ls.user_id
    WHERE mi.receiver_user_id = ? AND mi.status = 'pending'
    ORDER BY mi.id DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to fetch match invites",
        error: err.message
      });
    }

    return res.json({
      invites: results
    });
  });
}

function acceptMatchInvite(req, res) {
  const { inviteId } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({
      message: "Missing user_id"
    });
  }

  const sql = `
    SELECT *
    FROM match_invites
    WHERE id = ? AND receiver_user_id = ? AND status = 'pending'
    LIMIT 1
  `;

  db.query(sql, [inviteId, user_id], (err, rows) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to validate match invite",
        error: err.message
      });
    }

    if (!rows.length) {
      return res.status(404).json({
        message: "Match invite not found"
      });
    }

    const invite = rows[0];

    joinFriendlyRoomByCode(user_id, invite.room_code, (joinErr, room) => {
      if (joinErr) {
        return res.status(500).json({
          message: "Failed to join invited room",
          error: joinErr.message
        });
      }

      const updateSql = `
        UPDATE match_invites
        SET status = 'accepted'
        WHERE id = ?
      `;

      db.query(updateSql, [inviteId], (updateErr) => {
        if (updateErr) {
          return res.status(500).json({
            message: "Joined room but failed to update invite status",
            error: updateErr.message
          });
        }

        return res.json({
          message: "Match invite accepted successfully",
          room
        });
      });
    });
  });
}

function rejectMatchInvite(req, res) {
  const { inviteId } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({
      message: "Missing user_id"
    });
  }

  const sql = `
    UPDATE match_invites
    SET status = 'rejected'
    WHERE id = ? AND receiver_user_id = ? AND status = 'pending'
  `;

  db.query(sql, [inviteId, user_id], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to reject match invite",
        error: err.message
      });
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Match invite not found"
      });
    }

    return res.json({
      message: "Match invite rejected successfully"
    });
  });
}

module.exports = {
  sendMatchInvite,
  getIncomingMatchInvites,
  acceptMatchInvite,
  rejectMatchInvite
};