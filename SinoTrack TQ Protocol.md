Protocol 

## ST-901,901M,902,904,905/915/915W/925,906/906W/907 

1. Code Way： 

   1. SMS Code Way: PDU Mode 

   2. Command make up of ASCII Character, The coding way is 7 bit 

2. The Command Structure from Center Sending: 

   - *XX,YYYYYYYYYY,CMD,HHMMSS,PARA1,PARA2,…# 

For：* Command Title 

XX Manufacturer Name，Two Digital Fix the ASCII Character，eg: TH, DC, XY… 

The Vehicle Tracker will check the Manufacturer name whether it's correct, if incorrect that will not be the center command. 

can press the sos button to send the alarm message that can get the manufacturer 

Name from the alarm message(should be set the tracker firstly) , separator 

YYYYYYYYYY : Vehicle ID，Traker will ignore, and can use the character  fill in which less than 10 digital like:000 

- CMD : Command Mark 

HHMMSS Time : Hour/Minute/Second 

PARA : Command parameter 

- # : End Sign 

The English christcross-row of the Command Character should be use capital and 

Can’t insert any blank . 

3. The feedback message structure of Vehicle Tracker： General Message： 

*XX,YYYYYYYYYY,V1,HHMMSS,S,latitude,D,longitude,G,speed,direction,DDMMYY, vehicle_status# 

Confirm Message： 

*XX,YYYYYYYYYY,V4,CMD,hhmmss,HHMMSS,S,latitude,D,longitude,G,speed,directi on,DDMMYY,vehicle_status# 

For：* Command Title 

XX : Manufacturer Name，eg: TH, DC, XY.. 

, Sperator symbol 

YYYYYYYYYY : Vehicle ID 

CMD: Comfirmed center command 

Hhmmss: Confimed Time value of the command 

HHMMSS: Vehicle Time, Standard Time, have 8 time difference than Beijin 

S: Data Available bit (A/V), A is mean GPS data is valid. V is mean GPS data is 

invalid 

latitude：DDFF.FFFF, DD: Degree of Latitude（00 ~ 90）,FF.FFFF: cent of Latitude (00.0000to59.9999) Save four bit decimal fraction. 

- D: Latitude Sign, N: North Latitude S: South Latitude 

Longitude: Format :  DDDFF.FFFF, DDD: Degree of longitude (000 ~ 180), FF.FFFF:cent of longitude (00.0000 ~ 59.9999),  Save four bit decimal fraction. 

G: Longitude Sign (E: North Longitude, W: West Longitude) 

Speed: Wide : 000.00 ~ 999.99, Save Two bit decimal fraction 

This message segment maybe is empty, like longitude,G,direction, means speed is o DDMMYY: Day/Month/Year 

vehicle_status: Vehicle Status, four bits, means the status of vehicle and alarm status that use ASCII character for 16 hexadecimal, bit is mean use negative logic, like bit=0 

valid. See below: 

|Od||Save||Vehicle Status||Vehicle Status||Alarm Status|
|---|---|---|---|---|---|---|---|---|
|rer||Firt Byte||Second Byte||Third Byte||Fourth Byte|
|0|0|Steal Alarm|0|GPS<br>received<br>fault|0|Door Open|0|Steal Alarm|
|1|0|Password Wrong<br>Alarm|0|Reserve|0|Vehicle<br>Defence|0|SOS|
|2|0|SOS|0|Reserve|0|ACCclose|0|**Over**<br>**Speed**<br>**Alarm**|
|3|1|Reserve|0|External<br>Cut,<br>interval<br>Battery<br>work|0|Low Power|0|Illegal<br>Egine<br>Alarm|
|4|0|Power of car off<br>alarm|1|Reserve|0|Battery Bad|1|Reserve|
|5|1|Reserve|1|Reserve|0|Engin|1|Reserve|
|6|1|Reserve|1|Reserve|1|Reserve|1|Reserve|
|7|1|No Need|1|No Need|1|No Need|1|No need|



Tracker reply GPS information (Include HHMMSS,S,latitude, D, longitude, G, speed, direction, DDMMYY) mode: 

1. Valid Message Mode： 

This mode only reply the nearest gps message (valid data is mean "A"): if GPS 

data is invalid whichi is "V"that give up, tracker reply the last valid data(GPS Data is 

Freeze) 

2. The up-to-date message mode： 

In this mode, the tracker will always reply the up-to-date message whatever is "A" or "V" , if tracker in save power mode that will reply the last data before 

the gps close 

Tracker will work in the up-to-date message mode automatically before the first time receive the valid position message. 

Pay attention: voice channel is for real time transmiting and don't have the 

message mode problem, once start, gps will keep the no save power status and supply real time data. 

Message mode Set Way : 

The Manufacturer name is "HQ" will work in valid message mode when close the data function. and work in up-to-date message mode once open the data function 

The Manufacturer name is other name will work in up-to-date message mode when close 

the data 

function. and work in valid message mode once open the data function 

   1. Center Send Command 

- 1) Fixed Position monitor Command D1 

2 

*XX,YYYYYYYYYY,D1,HHMMSS, interval, count # Interval: Cycle Time，wide : 30 ~ 65535, the unit is second count：The time that the tracker send data to the server This command request that the tracker send data to the server that interval for the time cycle and count be the fix position position, and can't above 65535 times. when the tracker receive this command,tracker will send the data to the server immediately, 

if count is 1 or 0, interval is invalid, and reply one time general message. Tracker will send the first fixed position message to the server after receiving the command (V1), also put the D1 interval timer be 0 and start calculate the time ,if there are unsending data which from previous D1 command exsit, the new command will instead it eg: *TH,000,D1,130305,60,4# 

This command request that the tracker send one data to the server every 60 seconds, and the total time is 4. 

The Feedback message from Traker is : 

*TH,2020916012,V1,050316,A,2212.8745,N,11346.6574,E,14.28,028,220902,FFFFFBFF #   ; Pay Attention: The reply time is : 050316, The 13 of Beijin time is mean 5 of standard time 

2) The Automatically monitor command S17 *XX,YYYYYYYYYY,S17,HHMMSS, interval# interval：cycle time , the wide is  30 ~ 65535，unit is second. This command is for set the monitor parameter, interval is the cycle time that tracker send data to the server, when the monitor is open, tracker will send the general fixed position message to the server follow interval time. eg：*TH,000,S17,130305,1800# 

This command request that the tracker send one time message to the server every 30 minutes . Tracker will open the monitor option automatically after receiving the command and send the confirm message V4, also put the S17 interval timer be 0, if there are previous S17 comand exsit, the new command will cover it . *TH,2020916012,V4,S17,130305,050316,A,2212.8745,N,11346.6574,E,14.28,028,22090 2,FFFFFBFF# 

Tracker will reply the general message V1 as follow scheduled int erval time (the same as D1) S17 command is tangentially as D1, both of S17 and D1 can exsit at same time, if the time is same that only send one V1. 

- 3) Clean out alarm command R7 

   - *XX,YYYYYYYYYY,R7,HHMMSS # 

eg:*TH, 000000,R7,130305# 

Tracker will clean out all the alarm message after receivethe command and will not back message, monitor system can confirm whether clean out all the alarm by sending one monitor command. 

3 

Cold Start Command R1 

#### *XX,YYYYYYYYYY,R1,HHMMSS # 

eg:*TH, 000000,R1,130305# 

Vehicle will implement cold start reset after receive the command and no back message, All the alarm and call will stop . 

After cold start , the vehilce is no alarm status, all the alarm will be zero, but will not change the system configuration . 

Tracker send message active： 

In below status, the tracker will send the general message(V1) to the center active 

1. There are alarm happen, tracker will send one general message to the center, center can see the detail alarm from the status byte. 

### 1. Alarm 

1. Signal Input 

2. gps antenna plough, gps antenna short circuit, tracker use backup battery when 

3. external power cut off, power backout, door, sos button, engine, ACC, high power 

4. sensor(above 6V), low power sensor 

Defence Status 

5. No handle or remot controller of the tracker can't support defence, but can user-defined alarm for monitor the door and engine 

6. Car Status 

vehicle_status add some content, please check below form : 

|No.|First Byte|Second Byte|Third Byte|Fourth Byte|
|---|---|---|---|---|
|0|0 Temperature alarm<br>0|GPS fault alarm<br>0|Door|0<sup>Illegal open the door</sup><br>alarm|
|1|0Towalert<br>0|**Shake alarm**<br>0|Car defence|0 SOS|
|2|0 GPRSblock alarm<br>1|save<br>0|ACCclose|0 **Over speed alarm**|
|3|0<sup>Car in cut fuel and</sup><br>power status<br>0|<sup>Tracker get power from</sup><br>the backupbattery<br>1|save|0<sup>Illegal</sup><br>engine<br>on<br>alarm|
|4|0Power off alarm<br>0|Powerwas take out<br>1|save|0 Over defence alarm|
|5|0<sup>High power sensor 1 is</sup><br>high<br>0|<sup>GPS antenna carve out</sup><br>a way<br>0|engine|0<sup>GPS antenna carve</sup><br>out a wayalarm|
|6|0<sup>High power sensor 2 is</sup><br>high<br>0|<sup>GPS</sup><br>antenna<br>short<br>circuit<br>0|<sup>User-defined</sup><br>alarm|0<sup>GPS antenna short</sup><br>circuit alarm|
|7|0<sup>Low power sensor 1 by</sup><br>iron<br>0|<sup>Low power sensor 2 by</sup><br>iron<br>0|Over Speed|0<sup>Over</sup><br>geo<br>fence<br>alarm|



Tracker get the power from the backup battery(P1), the power voltage lower 11V(12V power),20V(24V power) or the power voltage higher 33V, at this time, tracker will use the backup battery. 

power backout(P2) : the battery voltage lower 6V 

Tracker off power and use the backup backup battery(P1), power backup(P2), the status is : 

|P1|P2|Status|
|---|---|---|
|1|1|power voltage is normally, tracker get power from<br>power of the car|
|1|0|Tracker batteryhaveproblem|



4 

|0|1|battery have power, but voltage is high or low, tracker|
|---|---|---|
|||get thepower from the backupbattery|
|0|0|External power was take out, tracker get the power<br>from the battery|



Car in cut fuel and power status : center sending cut off fuel and power command and 

complete this command, then the car can't engine on. 

High power sensor is high：high power sensor connect power 

Lower power sensor by iron：sensor input by iron Door Open：Door Sensor input by iron ACC OFF：ACC Cut off the power Car defence：tracker in intending or alertness status 

Engine：the engine status is in runing Car over speed : the speed over upper limit or lower limit (made it by S14) 

7. Alarm and Status 

vehicle_status have two sorts：alarm and status 

- a. Alarm: The X or X alarm of Vehicle-status is alarm, for guarante that the center will not lose any alarm, tracker use the touch off way, we will give a example for over speed alarm , when the car over the setting speed that will touch off the alarm, if the setting data is 80km/h, and the continous time is 10 seconds, when car over 80km/h, and in the 10 seconds, the over speed bit will become 0 from 1, if the speed is always keep in 80km/h, the alarm will not touch off again. 

b, After touch off the alarm, the alarm will be locked, that's mean whatever the speed is, the alarm bit all is 0, and if the over speed is happen again(the speed of the car should return back 80km/h, and then over 80km/h and keep this speed over 10 seconds ) ,because the over speed bit is 0 already, so tracker can't identify two alarm.so the locked status will keep it on until receive the clean out command from monitor center, then the over speed bit will become 1 (no alarm), the alarm answer wil not clean out alarm.. 

c. So the alarm means history record, over speed is mean that car have the over speed history record, others the tracker identity don't know what's happen for the over speed. 

d. There are no any connection between over speed alarm and car speed, this time,even the car is stop or close the over speed alarm function, tracker will still impletement over speed alarm until receive the clean out alarm from monitor center. only cold start and clean out command can do this things . 

For guarante the alarm is correct as the car status and also avoid lose alarm, the monitor center should establish two different alarm rule : terminal alarm and system alarm. any time the monitor center receive the terminal alarm, the monitor center will send the clean up alarm command and inform the terminal have receive the alarm(except SOS alarm), and also the monitor center should touch off and lock some system alarm and wait someone deal it. and monitor center should establish different level rule. 

Status : the outside bit of vehicle_status is status bit, status bit is for the 

car status when the message sending out, so this bit will change as the car status change. the bit of over speed from the vehicle_status which is the car speed status, when the speed is in legal area, the bit will be 1, when the speed is in irregular area, the bit is 0, at this time, the speed value is abnormality, maybe over the 

5 

upper limit or lower limit. 

Alarm and touch off way 

   - 1) SOS Button Alarm：once press the sos button, touch off the alarm 

- 2) Geo Fence Alarm：car over the setting area, and keep the over time for a while, touch off the alarm. 

- 3) Stop running alarm：car run the setting area, and keep the over time for a while, touch off the alarm 

- 4) Over speed alarm：the speed of the car over the setting speed value, and keep the time for a while, touch off the alarm 

- 5) Unlawful engine alarm：tracker in intending or alertness status, engine work above 20 seconds, touch off the alarm 

Alarm Flow 

Everytime touch off the alarm, whatever is fix alarm or user-defined alarm, tracker will send 1PCS general message to the center every 4 minutes, center will identify the alarm status according the car status , and then send the alarm command or cancel alarm command . 

### Part II: 

### Center sending command List 

Below command receive it from center, center can send all the message to every 

car by sms,at this time, tracker will ignor the command which is YYYYYYYYYY, 

command also can get it from paging centers that use POCSAG way and 1200bit/s way 

for coding, the car of paging centers will know they own address by YYYYYYYYYY 

command, 

if YYYYYYYYYY=0000000000, that's mean broadcast command, tracker send message to the center by SMS. 

- 1) Set the Speed limit S14 

*XX,YYYYYYYYYY,S14,HHMMSS,Max_speed,Min_speed,M,countinue # 

Max_speed：Set upper limit, the wide is 1 ~ 255，the unit is byte Min_speed：Set lower limit, the wide is 1 ~ 255，the unit is byte 

Set Max_speed =0 cancel the speed upper limit, set Min_speed =0 cancel speed lower limit Max_Speed set 5-10 ，can use for  the move alarm of the car . 

when compare these data that ignor the decimal fraction of the speed, speed above or equal to Max_speed that mean above speed upper limit, speed less than Min_speed that mean above speed lower limit 

M: valid condition 

M = 0: dummy set, and will not change the current parameter, tracker back V4 message, center can check the current setting. 

M = 1: GPS position data is valid (A) and speed also is valid, if the gps status is V that mean speed no above the limit. 

M = 2 or other number, whatever the gps data is valid or invalid, the speed always valid 

(A or V,V is not mean not get the gps position, sometims mabe the statellite is not enough, but the data still can use it, just the accurate is low, and no gps signal also is V,this time the 

6 

position data will not change) 

countinue：Continous time, the wide is 5 ~ 65535，units is second。Countinue=0 is mean keep new parameter（continue=0） cancel the over speed alarm function, and also put the bit2 of set_flag to 1 . Countinue = other value, will open the speed limit, bit2 of set_flag will be 0 . 

The tracker will take over speed alarm is base on the car change the speed from 

valid speed to invalid speed and keep some time. after that, the speed is quickly or slowly that will not have new alarm, but every time receive the limit speed command, the tracker will put the car status be the last speed, and tracker will detect the over speed happen, once it's happen , will take alarm. 

When the car in the invalid speed area, the over speed bit of vehicle status 

will become 0 . eg:*TH,0000000000,S14,130305,100,10,1,3#  ; This command is mean that when the speed above 100bit and keep the time is 3 seconds or lower 10 bit, will touch off over speed alarm, but the condition is that the gps data is valid. 

Tracker back message is like this : 

- *TH,2020916012,V4,S14,100,10,1,3,130305,050316,A,2212.8745,N,11346.6574,E,14.28,0 

28,220902,FFFFFBFF# 

This setting parameter from the command will not lost even the power is off 

4) Startup cut off fuel and power S20 

- *XX,YYYYYYYYYY,S20,HHMMSS,C,time1,time2,…time30# 

C: final cut off power way 

C=0:dynamic cut off fuel and power, detect the engine work and then cut the power 5 

seconds, stop the parameter work 

C=1or other number, static cut off fuel and power, will not detect the engine, the 

relay will always connect it, and cut off the power 

dynamic cut off power will not consume the power from the car, but should connect to the engine signal (power light) 

If don't wang to connect the engine signal, then can use static cut fuel and power way 

In intend or alertness status, stop startup the engine and only can use dynamic 

cut off power and fuel way ,so if want to support defence function(should have handle or 

remote control), should connect to the engine signal 

time：Action continous time, wide is , unit is second, if above the wide all use 5 for 

calculate it eg:*TH,0000000000,S20,130305,1,3,10,3,5,5,3,5,3,5,3,5#  ; 

Tracker receive the command will examine the set_flag, if don't support cut off fuel and power, will back the message directly 

- *TH,2020916012,V4,S20,ERROR,130305,050316,A,2212.8745,N,11346.6574,E,14.28,028, 

220902,FFFFFBFF# 

Whether support cut off fuel and power that the S12 command can set it , but attention that will change the automatical monitor status when setting the cut off fuel and power. 

If support cut off fuel and power, will cut power 3 seconds(time1),electrify 10 

seconds(time2), cut power 3 seconds(time3),electrify 5 seconds(time4),cut power 

7 

5 seconds(time5), electrify 3 seconds(time6), cut power 5 seconds(time7), electrify 

3 seconds(time8), cut power 5 seconds(time9), electrify 3 seconds(time10), cut 

power 5 seconds(time11), completeness cut off power, the limit completeness or cut off time is not above 30 times. time1 is mean always cut power time . whatever the final time is completeness or cut off status, all implement completeness cut off power, and keep the cut off power status by C, and after cut off power will back message : 

*TH,2020916012,V4,S20,DONE,130305,050316,A,2212.8745,N,11346.6574,E,14.28,028,2 

20902,F7FFFBFF# 

In intend or alertness status, if receive the command that will cut off fuel 

and power (dynamic) directly and back the up message; 

In cut off fuel and power status will use the new cut fuel and power way according C, and then back the up message; 

If receive the command and also in the cut off fuel and power work time which will restart the command; 

Tracker can't going to the alertness status if in the cut off fuel and power work time Renew the fuel and power way , one way is that put the bit0 of set_flag (S12 command) be 1 or set the S20 command which the first time is 0, the back way will back message : 

*TH,2020916012,V4,S20,OK,130305,050316,A,2212.8745,N,11346.6574,E,14.28,028,220 

902,FFFFFBFF# 

We suggest that use the second way, the first way can't support cut off fuel and power, 

so that's mean next time should send the S12 before startup cut off power and fuel. 

Clean out the alarm command (R7) that can renew fuel and power normally work, but no 

feedback message 

Restart the tracker or cold start command also will renew the fuel and power working . 

- 18) Mileage Command S32 

Tracker set the mileage function, the work principle is that integral the gps speed, that's mean in GPS navigation status, accumulate the speed in every second, cause the unit is bit of speed, so like 1852 meter/ 3600 seconds, so the way is : 

1852/3600=0.51444 

- *XX,YYYYYYYYYY,S32,HHMMSS,M# 

This command examine the mileage of the car 

M=0：mileage will become 0 

M=1 or other number : examine the mileage eg：*TH,000,S32,130305,1# 

back: 

*TH,2020916012,V4,S32,0000130502.35,130305,050316,A,2212.8745,N,11346.6574,E,14.28,0 28,220902,FFFFFBFF# 

0000130502.35:ruan mileage, unit :0.51444 meter，130502.35 mean 67136.2 meter 

The more count is 9999999999.99，like 5million，after that tracker will calculate the mileage from 0 . 

8 

Manufacture default: mileage is 0，the mileage will not lost even cut off the power and fuel Attention: the mileage data will accumulate base on the GPS data is A, and there are also some error exsit, so only can be reference . 

The standard mode record(binary system V1 general message) coding format： 

|NO.|00<br>01<br>02|03|04|05|06|07|08|09<br>0A|0B|
|---|---|---|---|---|---|---|---|---|---|
|Conte<br>nt|$ 0x1|03073100|1||0x|05031|6|0x22090|2|
|Mean|Record<br>head<br>T|racker ID||||Time||Date||
|No.|0C<br>0D<br>0E<br>0F|10|11|12|13|14|15|16<br>17|18|
|conte<br>nt|0x22128745|0x00||0x11|34665|74C||0x01402|8|
|Mean|Latitude value|save|Lon|gtitude|value|、N、E|、AV|Speed, direc|tion|
|NO.|19<br>1A<br>1B|1C||1D|||1E|1F||
|conte<br>nt|0Xfffffbff|||0xff|||0x00|||
|mean|vehicle_status||Usr_|alarm_f|lag||save|Reco<br>numb|rd<br>er|



Explanation：$ (0x24): record head, for identify the record origination position . Time：0x050316, Standard time 5:0316, 16 mean 16 seconds, like 13:0316 of Beijin time; Date：0x220902, 2002 year, September, 22th 

Latitude value: 0x22128745, 22°12.8745 number 0x15 mean: 

bit7654, the last bit of longitude 

bit3, 1: north longtide，0：west longitude bit2, 1: north latitude，0：south latitude bit1, 1: A, 0:V 

bit0, undefinition 

Speed, direction: 0x014028: speed 014 knot, direction 028 

vehicle_status, Usr_alarm_flag: use binary system for the car status and user-defined  alarm status. it's same as 

message (ASCII) 

Record number : use binary system for the record number, everytime send one record and will add 1 automatically 

Attention：standard mode record(like V1 general message) no temperature data 

The difference between X mode record coding format and standard mode record： 

|Number<br>00|01|02|03|04|05<br>10<br>15|
|---|---|---|---|---|---|



9 

|Standard mode<br>content|$|0x1030731001|0x00|4C|
|---|---|---|---|---|
|Standard mode<br>mean|Record<br>head|Vehicle ID|save|N, E, AV|
|X mode content|X|0x0000130502|0x31|4D|
|X mode mean|Record<br>head|integer part of mileage data|Temperature<br>value|N, E, AV, TS|



Explanation： 

The record head of X mode is  X(0x58), for identify the record begin position； 

The integer part of mileage data : 0000130502: run mileage, units: 0.51444meter, 130502 is 

decimal system BCD coding，130502X0.51444=67135.449meter . 

Attention：X Mode record is only can use TCP protocol for transfer, if in the record that nonumber message, the GPRS channel server which support X mode should be register vehicle ID which corresponding SOCKET when the tracker login register, and also everytime receive the 

X record and put this X record to the record to other procedure.UDP protocol only can transfer 

the standard mode record . 

10 

# The GPRS Mode : 

The English Adddress requst protocol (Terminal Request) 

*XX,YYYYYYYYYY,V3,HHMMSS,S,latitude,D,longitude,G,speed,direction,DDM MYY,vehicle_status, net_mcc,net_mnc,net_lac,net_cellid# 

The English Address feedback protocl (The Server down sends）： *HQ,4106000054,I1_2_EN,130305,10,1,9,test12345 

The Chinese Adddress requst protocol（Terminal Request）： 

*XX,YYYYYYYYYY,V2,HHMMSS,S,latitude,D,longitude,G,speed,direction,DDM MYY,vehicle_status, net_mcc,net_mnc,net_lac,net_cellid# 

The Chinese Address feedback protocl (The Server down sends）： 

*HQ,4106000054,I1,130305,10,1,4, 5e 7f 4e 1c 

*HQ,4106000054,I0,130305,10,1,2, 5e 7f 4e 1c net_mcc,net_mnc,net_lac,net_cellid#  460,01,43559,344224# 

The stardard mode upload data ： 

### Coding format： 

|Serial<br>numb|00|01|02|03|04|05|06|07|08|09|0A|0B|
|---|---|---|---|---|---|---|---|---|---|---|---|---|
|er|||||||||||||
|Conte<br>nt|$||0x10|307310|01||0x|05031|6|0|x2209|02|
|mean|Record<br>ing<br>Head|Vehicl|e Trac|ker Seri|al Num|ber||Time|||Date||
|Serial|||||||||||||
|numb<br>er|0C<br>0D|<br>0E|0F|10|11|12|13|14|15|16|17|18|



11 

|conte<br>nt|0x2212|8745|0x0|0|0x113466574C|0x014028|
|---|---|---|---|---|---|---|
|mean|Latitude|value||Lon|gitude Value、N、E、<br>AV|Speed,<br>Direction|
|Serial<br>numb<br>er|19~1C|1D|1E|1F|||
|Conte<br>nt|0Xfffffbff|0xff|0x00||||
|mean|vehicle_st<br>atus|Usr_ala<br>rm_flag|Save|Rec<br>ordi<br>ng<br>Num<br>ber|||



# Status Definition(vehicle_status): 

|The<br>Byte<br>Sequ<br>ence|The first byte||The second byte|The third<br>byte|T|he four|th Byte|
|---|---|---|---|---|---|---|---|
|0|0|0|GPS<br>Received<br>fault Alarm|0|0|||
|1|0<br>Move Alarm|0|Shake Alarm|0<br>Car<br>Defence|0|SOS A|larm|
|2|0<br>make<br>a<br>report<br>data|1|Reserve|0<br>ACC Off|0|Over<br>alarm|Speed|
|3|0<br>The vehicle in<br>cut fule status|0|Tracker get the<br>power from the<br>backup battery|0|0|Illegal<br>Alarm|Egine|
|4|0<br>Power of the car<br>off alarm|0|The<br>power<br>is<br>backout|1<br>Reserve|0|Geo<br>Alarm|Fence<br>(In)|
|5|0|0||0<br>engine|0|||
|6|0|0||0|0|||
|7|0|0||0<br>over<br>speed|0|Geo<br>Alarm|Fence<br>(out)|



12 

