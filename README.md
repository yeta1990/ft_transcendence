**Overview**
============

-   Web app to play Pong online against other players: challenges, ranking, ladder, different game modes and power ups.

-   Chat rooms with persistence, private messages, friends, etc.

-   Websockets for game and chat, login with Oauth2, user privilege management, 2FA with QR via mobile app.




https://github.com/yeta1990/ft_transcendence/assets/65416560/2f7e15a3-ec85-425d-9250-5454dfcb0800





**Stack**
=========

A set of dockerized applications to serve at localhost:80

-   Front end: Angular + Bootstrap
-   Back end: NestJS + TypeORM + Socket.io
-   Database: PostgreSQL
-   Web server: nginx

**Tools:**

-   Adminer: available as a separated container to ease database administration and review

-   Makefile: shortcuts for deployment and running, docker-related operations, delete npm packages, etc.

 
**Features**
============

### Chat

-   Public and private channels.

-   Private messages between users.

-   Block another user.

-   Privileges: owner, admins, users and banned. These privileges affect to each channel, but aren't related to website privileges.

-   Channel management: moderate channel, silence user, set channel password, kick user and change privileges of user

### Game
-   Pong multiplayer online with different modes.

    -   Vs computer: practice against the computer

    -   Normal challenge: users can send a game proposals to other users

    -   Matchmaking list: join a waitlist to play a Normal challenge against another connected user

    -   Fun mode: waitlist to play a Fun challenge, 3 powers are randomly given to each player

-   Ladder: ELO is calculated after each Normal challenge.

-   User achievements

-   Broadcast all live games: all connected users can watch all live games real time

-   Disconnection handling: in case of disconnection, game is paused and disconnected user has a few seconds to return to the game.

-   Replay: after each game, users are asked to play again.



https://github.com/yeta1990/ft_transcendence/assets/65416560/84765dc0-30df-4a59-9ff2-00b5359fa1f0



### Users

-   Login with 42's Oauth2

-   Real time status: online, offline or playing

-   Block users, add/remove friends

-   Nick change: users can change they nick, as long as it is unique, and the changes are spread to the rest of the users via socket.

-   Avatar: users can pick a predefined avatar or upload a custom image (png or jpeg)

### Security

-   2FA: users can set up two-factor authentication through a QR. A phone code generator app such as Google Authenticator or Microsoft Authenticator is required.

-   When users are banned from website, they are inmediately disconnected, their token is blacklisted and further logins are forbidden.

-   When user privileges are changed, they are inmediately disconnected, their token is blacklisted and are required to login again.

-   Uploaded files: only jpg and png are allowed. Revision is done not only by file extension of the file but also by checking the file signatures in header.

-   Endpoints highly protected to prevent common vulnerabilities such as Broken Authentication, Broken Access Control, Broken Object Property, Broken Function, etc.

-   Furthermore, database is protected against Injection Attacks, all forms are validated in front and backend, and CORS is activated.



https://github.com/yeta1990/ft_transcendence/assets/65416560/267e50c6-c29a-4770-932d-786bb8ad5eb5



### Administration

There is one web owner who has all the privileges. Besides, the web admins are chosen by the owner. Both web owner and web admins can perform these actions:

-   Web/general:

    -   Give and remove admin privileges to other users

    -   Ban other users from website (except owner)

-   Chat:

    -   See all the messages from all the channels without joining them, including private ones.

    -   Destroy channels

    -   Change user privileges in a channel: change owner, add/remove admins, kick and silence users
