#!/usr/bin/env python
# coding: utf-8

# In[3]:


import pandas as pd
import zipfile
import re
import os


# In[2]:


files = [i for i in os.listdir("./data/") if i.endswith("zip")]

for file in files:
    zip_ref = zipfile.ZipFile('./data/{}'.format(file), 'r')
    zip_ref.extractall('./extract/')
    zip_ref.close()


# In[1]:


files = [i for i in os.listdir("./extract/") if i.endswith("csv")]

df_out = pd.DataFrame()

for file in files:
    point = file[file.find("(")+1:file.find(")")]
    gps = pd.read_csv('./extract/{}'.format(file), usecols=[0,1]).loc[0]
    site_name = gps[' Site Name']
    df = pd.read_csv('./extract/{}'.format(file), skiprows=2)
    df['point'] = point
    df['site_name'] = site_name
    df_out = pd.concat([df_out, df])


# In[2]:


df_out.to_csv('./out/master.csv', index=False)


# In[40]:


tab_med = df_out[['point', 'site_name',' Total Carriageway Flow']].groupby('point').median().reset_index().rename({' Total Carriageway Flow': 'median'},axis=1)
tab_min = df_out[['point', 'site_name',' Total Carriageway Flow']].groupby('point').min().reset_index().rename({' Total Carriageway Flow': 'min'},axis=1)
tab_max = df_out[['point', 'site_name',' Total Carriageway Flow']].groupby('point').max().reset_index().rename({' Total Carriageway Flow': 'max'},axis=1)
tab_max = df_out[['point', 'site_name',' Total Carriageway Flow']].groupby('point').std().reset_index().rename({' Total Carriageway Flow': 'std'},axis=1)


# In[41]:


tab = pd.merge(
    left=tab_med,
    right=tab_min,
    how='left'
)

tab = pd.merge(
    left=tab,
    right=tab_max,
    how='left'
)


# In[44]:


tab.to_csv('./out/table.csv', index=False)


# In[50]:


test = df_out[
    df_out['point'] == 'LM291'
]


# In[52]:


len(test)


# In[54]:


tab


# In[23]:


df_site = pd.read_csv('./extract/2014 MIDAS Site 11 (AL1815).csv', usecols=[0,1]).loc[0]


# In[24]:


df_site[' Site Name']


# In[ ]:




