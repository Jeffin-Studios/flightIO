3 classes of planes:
=====================
Dogfighter (escort)
  medium speed, medium armor, high rate of fire (machine gun), low damage, short range
Bomber (essential for destroying bases)
  low speed, high armor, low rate of fire, high damage, N/A
Jet (fast striker)
  high speed, low armor, medium rate of fire, medium damage, long range



Game is battle between three airbases
Players are sorted into three teams, with respective spawn locations at these airbases
The goal is to attack the other airbases
Teams can be distinguished by color (red, blue, green). These are also the color of the bullets
Plane follows cursor, shoot by clicking



obstacles are either walls in the sky (instant death) or floating booby traps that explode and inflict damage upon collision
if you go high enough, obstacles are meteors (moving)


Make turrets that shoot too


figure out how to make bullets on server, and emit to client every time interval
each bullet has an id
if the client player is hit by a bullet, send event to server and delete the bullet at the id and also update plyaers list to reflect damage
