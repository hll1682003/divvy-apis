# Dependencies:

Regular:

`Express.js`,
`axios`,
`moment`,
`jsonwebtoken`

Environmental variables and Testing:

`dotenv`,
`jest`,
`supertest`

# Endpoints:

<table>
<thead>
<tr>
<th>Method</th>
<th>Endpoint</th>
<th>Request body example</th>
</tr>
</thead>
<tbody>
<tr>
<td><span style="color:blue">GET</span></td>
<td>/getToken/</td>
<td>(Only for testing and getting JWT token)</td>
</tr>
<tr>
<td><span style="color:blue">GET</span></td>
<td>/stations/<span style="color:red">stationId</span></td>
<td>N/A</td>
</tr>
<tr>
<td><span style="color:blue">POST</span></td>
<td>/age-distribution</td>
<td>
{
"stations":[2,3,5]
,"date":"2019-04-02"
}
</td>
</tr>
<tr>
<td><span style="color:blue">POST</span></td>
<td>/last-twenty-trip</td>
<td>
{
"stations":[2,3,5]
,"date":"2019-04-02"
}
</td>
</tr>
</tbody>
</table>

# Envinronmental variables:

DATA_FILE_PATH: the URL of "Divvy_Trips_2019_Q2"
STATION_INFO_URL: the URL of "Station Information"
ACCESS_TOKEN_SECRET: token secret for jwt token
