import { getId } from "../utilities"

export default function newNode(position) {
    const startingTimer = Math.random() * 5000
    const id = getId()
    return {
        id,
        ui: {
            position,
            timerColor: "green",
            timerSize: 1,
        },
        data: {
            timer: startingTimer,
            startingTimer,
            voted: null,
            myVotes: 0,
            myLeader: null,
            epoch: -1,
        },
        getTitle: function () {
            let role = "follower"

            if (this.data.myLeader === this.id) {
                role = "leader"
            } else if (this.data.myLeader === null && this.data.myVotes > 0) {
                role = "leader candidate"
            }

            return `${this.id} - ${role}`
        },
        getLabel: function () {
            return (
                <>
                    Voted: {this.data.voted !== null ? this.data.voted : "-"}
                    <br />
                    Votes received: {this.data.myVotes}
                    <br />
                    Epoch: {this.data.epoch}
                </>
            )
        },
        receivePacket: function (data, actions) {
            if (data.leader !== undefined && this.data.epoch < data.epoch) {
                actions.send(
                    { vote: true, epoch: data.epoch },
                    data.leader,
                    "red"
                )
                this.data.voted = data.leader
                this.data.epoch = data.epoch
                this.data.myLeader = data.leader
                this.ui.timerColor = "green"
                this.data.timer = 7000
                this.data.startingTimer = 7000
            } else if (data.vote && this.data.epoch === data.epoch) {
                this.data.myVotes++
                if (this.data.myVotes >= 3) {
                    this.data.myLeader = this.id
                    if (this.data.myVotes === 3) {
                        this.data.timer = 1000
                        this.data.startingTimer = 1000
                        this.ui.timerColor = "gray"
                        actions.broadcast(
                            { keepalive: this.id, epoch: this.data.epoch },
                            "gray"
                        )
                    }
                }
            } else if (
                data.keepalive !== undefined &&
                data.epoch >= this.data.epoch
            ) {
                this.data.timer = 3000
                this.data.startingTimer = 3000
                this.data.myLeader = data.keepalive
                this.data.epoch = data.epoch
                this.ui.timerColor = "green"
            }
        },
        loop: function (actions, timeStep) {
            this.data.timer -= timeStep
            this.ui.timerSize = this.data.timer / this.data.startingTimer

            if (this.data.timer <= 0) {
                if (this.data.myLeader === this.id) {
                    this.data.timer = 1000
                    this.data.startingTimer = 1000
                    actions.broadcast(
                        { keepalive: this.id, epoch: this.data.epoch },
                        "gray"
                    )
                } else {
                    this.data.epoch++
                    actions.broadcast(
                        { leader: this.id, epoch: this.data.epoch },
                        "green"
                    )
                    this.data.voted = this.id
                    this.data.myVotes = 1
                    this.ui.timerSize = 0
                    this.data.timer = 5000 + 3000 * Math.random()
                    this.data.startingTimer = this.data.timer
                }
            }
        },
    }
}
